package router

import (
	"context"
	"encoding/json"
	"fmt"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type Buckets struct{}

func (b *Buckets) GetAll(w http.ResponseWriter, r *http.Request) {
	body, err := utils.Garage.Fetch("/v2/ListBuckets", &utils.FetchOptions{})
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	var buckets []schema.GetBucketsRes
	if err := json.Unmarshal(body, &buckets); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Get current user for permission filtering
	userID := utils.Session.Get(r, "user_id")
	var currentUser *schema.User
	if userID != nil {
		currentUser, _ = utils.Users.GetByID(userID.(string))
	}

	ch := make(chan schema.Bucket, len(buckets))

	for _, bucket := range buckets {
		go func() {
			body, err := utils.Garage.Fetch(fmt.Sprintf("/v2/GetBucketInfo?id=%s", bucket.ID), &utils.FetchOptions{})

			if err != nil {
				ch <- schema.Bucket{ID: bucket.ID, GlobalAliases: bucket.GlobalAliases}
				return
			}

			var data schema.Bucket
			if err := json.Unmarshal(body, &data); err != nil {
				ch <- schema.Bucket{ID: bucket.ID, GlobalAliases: bucket.GlobalAliases}
				return
			}

			data.LocalAliases = bucket.LocalAliases
			ch <- data
		}()
	}

	res := make([]schema.Bucket, 0, len(buckets))
	for i := 0; i < len(buckets); i++ {
		bucket := <-ch
		
		// Filter buckets based on user permissions
		if currentUser != nil && currentUser.Role != schema.RoleAdmin {
			// Get bucket name from global aliases
			bucketName := ""
			if len(bucket.GlobalAliases) > 0 {
				bucketName = bucket.GlobalAliases[0]
			}
			
			// Check if user has permission
			if bucketName != "" && !utils.Users.HasBucketPermission(currentUser.ID, bucketName) {
				continue
			}
		}
		
		res = append(res, bucket)
	}

	utils.ResponseSuccess(w, res)
}

func (b *Buckets) GetLifecycleConfiguration(w http.ResponseWriter, r *http.Request) {
	bucket := r.URL.Query().Get("bucket")
	if bucket == "" {
		utils.ResponseError(w, fmt.Errorf("bucket parameter is required"))
		return
	}

	client, err := getS3Client(bucket)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	result, err := client.GetBucketLifecycleConfiguration(context.Background(), &s3.GetBucketLifecycleConfigurationInput{
		Bucket: &bucket,
	})

	if err != nil {
		// If no lifecycle configuration exists, return empty rules
		utils.ResponseSuccess(w, schema.LifecycleConfiguration{Rules: []schema.LifecycleRule{}})
		return
	}

	// Convert AWS types to our schema
	rules := make([]schema.LifecycleRule, 0, len(result.Rules))
	for _, rule := range result.Rules {
		schemaRule := schema.LifecycleRule{
			ID:     getStringValue(rule.ID),
			Status: string(rule.Status),
		}

		if rule.Prefix != nil {
			schemaRule.Prefix = rule.Prefix
		}

		if rule.Filter != nil {
			filter := &schema.LifecycleFilter{}
			
			// Handle Filter members based on AWS SDK types union
			switch v := rule.Filter.(type) {
			case *types.LifecycleRuleFilterMemberPrefix:
				filter.Prefix = v.Value
			case *types.LifecycleRuleFilterMemberTag:
				filter.Tags = []schema.LifecycleTag{{Key: *v.Value.Key, Value: *v.Value.Value}}
			case *types.LifecycleRuleFilterMemberAnd:
				and := &schema.LifecycleFilterAnd{}
				if v.Value.Prefix != nil {
					and.Prefix = *v.Value.Prefix
				}
				if v.Value.Tags != nil {
					and.Tags = make([]schema.LifecycleTag, 0, len(v.Value.Tags))
					for _, tag := range v.Value.Tags {
						and.Tags = append(and.Tags, schema.LifecycleTag{Key: *tag.Key, Value: *tag.Value})
					}
				}
				filter.And = and
			}
			schemaRule.Filter = filter
		}

		if rule.Expiration != nil {
			schemaRule.Expiration = &schema.LifecycleExpiration{
				Days:                      rule.Expiration.Days,
				ExpiredObjectDeleteMarker: rule.Expiration.ExpiredObjectDeleteMarker,
			}
			if rule.Expiration.Date != nil {
				dateStr := rule.Expiration.Date.Format("2006-01-02")
				schemaRule.Expiration.Date = &dateStr
			}
		}

		if rule.NoncurrentVersionExpiration != nil {
			schemaRule.NoncurrentVersionExpiration = &schema.NoncurrentVersionExpiration{
				NoncurrentDays: rule.NoncurrentVersionExpiration.NoncurrentDays,
			}
		}

		if rule.AbortIncompleteMultipartUpload != nil {
			schemaRule.AbortIncompleteMultipartUpload = &schema.AbortIncompleteMultipartUpload{
				DaysAfterInitiation: rule.AbortIncompleteMultipartUpload.DaysAfterInitiation,
			}
		}

		rules = append(rules, schemaRule)
	}

	utils.ResponseSuccess(w, schema.LifecycleConfiguration{Rules: rules})
}

func (b *Buckets) PutLifecycleConfiguration(w http.ResponseWriter, r *http.Request) {
	bucket := r.URL.Query().Get("bucket")
	if bucket == "" {
		utils.ResponseError(w, fmt.Errorf("bucket parameter is required"))
		return
	}

	var req schema.PutLifecycleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	client, err := getS3Client(bucket)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Convert our schema to AWS types
	rules := make([]types.LifecycleRule, 0, len(req.Rules))
	for _, rule := range req.Rules {
		awsRule := types.LifecycleRule{
			Status: types.ExpirationStatus(rule.Status),
		}

		if rule.ID != "" {
			awsRule.ID = &rule.ID
		}

		if rule.Prefix != nil {
			awsRule.Prefix = rule.Prefix
		}

		if rule.Filter != nil {
			// Convert filter to AWS SDK union type
			if rule.Filter.Prefix != "" {
				awsRule.Filter = &types.LifecycleRuleFilterMemberPrefix{
					Value: rule.Filter.Prefix,
				}
			} else if len(rule.Filter.Tags) > 0 {
				awsRule.Filter = &types.LifecycleRuleFilterMemberTag{
					Value: types.Tag{Key: &rule.Filter.Tags[0].Key, Value: &rule.Filter.Tags[0].Value},
				}
			} else if rule.Filter.And != nil {
				and := types.LifecycleRuleAndOperator{}
				if rule.Filter.And.Prefix != "" {
					and.Prefix = &rule.Filter.And.Prefix
				}
				if len(rule.Filter.And.Tags) > 0 {
					and.Tags = make([]types.Tag, 0, len(rule.Filter.And.Tags))
					for _, tag := range rule.Filter.And.Tags {
						and.Tags = append(and.Tags, types.Tag{Key: &tag.Key, Value: &tag.Value})
					}
				}
				awsRule.Filter = &types.LifecycleRuleFilterMemberAnd{
					Value: and,
				}
			}
		}

		if rule.Expiration != nil {
			awsRule.Expiration = &types.LifecycleExpiration{
				Days:                      rule.Expiration.Days,
				ExpiredObjectDeleteMarker: rule.Expiration.ExpiredObjectDeleteMarker,
			}
		}

		if rule.NoncurrentVersionExpiration != nil {
			awsRule.NoncurrentVersionExpiration = &types.NoncurrentVersionExpiration{
				NoncurrentDays: rule.NoncurrentVersionExpiration.NoncurrentDays,
			}
		}

		if rule.AbortIncompleteMultipartUpload != nil {
			awsRule.AbortIncompleteMultipartUpload = &types.AbortIncompleteMultipartUpload{
				DaysAfterInitiation: rule.AbortIncompleteMultipartUpload.DaysAfterInitiation,
			}
		}

		rules = append(rules, awsRule)
	}

	_, err = client.PutBucketLifecycleConfiguration(context.Background(), &s3.PutBucketLifecycleConfigurationInput{
		Bucket: &bucket,
		LifecycleConfiguration: &types.BucketLifecycleConfiguration{
			Rules: rules,
		},
	})

	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, map[string]string{"message": "Lifecycle configuration updated successfully"})
}

func (b *Buckets) DeleteLifecycleConfiguration(w http.ResponseWriter, r *http.Request) {
	bucket := r.URL.Query().Get("bucket")
	if bucket == "" {
		utils.ResponseError(w, fmt.Errorf("bucket parameter is required"))
		return
	}

	client, err := getS3Client(bucket)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	_, err = client.DeleteBucketLifecycle(context.Background(), &s3.DeleteBucketLifecycleInput{
		Bucket: &bucket,
	})

	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, map[string]string{"message": "Lifecycle configuration deleted successfully"})
}

func getStringValue(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}
