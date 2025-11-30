package schema

type GetBucketsRes struct {
	ID            string       `json:"id"`
	GlobalAliases []string     `json:"globalAliases"`
	LocalAliases  []LocalAlias `json:"localAliases"`
	Created       string       `json:"created"`
}

type Bucket struct {
	ID                             string        `json:"id"`
	GlobalAliases                  []string      `json:"globalAliases"`
	LocalAliases                   []LocalAlias  `json:"localAliases"`
	WebsiteAccess                  bool          `json:"websiteAccess"`
	WebsiteConfig                  WebsiteConfig `json:"websiteConfig"`
	Keys                           []KeyElement  `json:"keys"`
	Objects                        int64         `json:"objects"`
	Bytes                          int64         `json:"bytes"`
	UnfinishedUploads              int64         `json:"unfinishedUploads"`
	UnfinishedMultipartUploads     int64         `json:"unfinishedMultipartUploads"`
	UnfinishedMultipartUploadParts int64         `json:"unfinishedMultipartUploadParts"`
	UnfinishedMultipartUploadBytes int64         `json:"unfinishedMultipartUploadBytes"`
	Quotas                         Quotas        `json:"quotas"`
	Created                        string        `json:"created"`
}

type LocalAlias struct {
	AccessKeyID string `json:"accessKeyId"`
	Alias       string `json:"alias"`
}

type KeyElement struct {
	AccessKeyID        string      `json:"accessKeyId"`
	Name               string      `json:"name"`
	Permissions        Permissions `json:"permissions"`
	BucketLocalAliases []string    `json:"bucketLocalAliases"`
	SecretAccessKey    string      `json:"secretAccessKey"`
}

type Permissions struct {
	Read  bool `json:"read"`
	Write bool `json:"write"`
	Owner bool `json:"owner"`
}

type Quotas struct {
	MaxSize    int64 `json:"maxSize"`
	MaxObjects int64 `json:"maxObjects"`
}

type WebsiteConfig struct {
	IndexDocument string `json:"indexDocument"`
	ErrorDocument string `json:"errorDocument"`
}

// Lifecycle Configuration Structs
type LifecycleConfiguration struct {
	Rules []LifecycleRule `json:"rules"`
}

type LifecycleRule struct {
	ID                             string                          `json:"id"`
	Status                         string                          `json:"status"` // "Enabled" or "Disabled"
	Prefix                         *string                         `json:"prefix,omitempty"`
	Filter                         *LifecycleFilter                `json:"filter,omitempty"`
	Expiration                     *LifecycleExpiration            `json:"expiration,omitempty"`
	NoncurrentVersionExpiration    *NoncurrentVersionExpiration    `json:"noncurrentVersionExpiration,omitempty"`
	AbortIncompleteMultipartUpload *AbortIncompleteMultipartUpload `json:"abortIncompleteMultipartUpload,omitempty"`
}

type LifecycleFilter struct {
	Prefix string            `json:"prefix,omitempty"`
	Tags   []LifecycleTag    `json:"tags,omitempty"`
	And    *LifecycleFilterAnd `json:"and,omitempty"`
}

type LifecycleFilterAnd struct {
	Prefix string         `json:"prefix,omitempty"`
	Tags   []LifecycleTag `json:"tags,omitempty"`
}

type LifecycleTag struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type LifecycleExpiration struct {
	Days                      *int32  `json:"days,omitempty"`
	Date                      *string `json:"date,omitempty"`
	ExpiredObjectDeleteMarker *bool   `json:"expiredObjectDeleteMarker,omitempty"`
}

type NoncurrentVersionExpiration struct {
	NoncurrentDays *int32 `json:"noncurrentDays,omitempty"`
}

type AbortIncompleteMultipartUpload struct {
	DaysAfterInitiation *int32 `json:"daysAfterInitiation,omitempty"`
}

// Request/Response structs for lifecycle endpoints
type PutLifecycleRequest struct {
	Rules []LifecycleRule `json:"rules"`
}
