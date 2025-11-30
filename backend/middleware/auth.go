package middleware

import (
	"errors"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := utils.Session.Get(r, "authenticated")

		if auth == nil || !auth.(bool) {
			utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// BucketPermissionMiddleware checks if user has permission to access a bucket
func BucketPermissionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := utils.Session.Get(r, "user_id")
		if userID == nil {
			utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
			return
		}

		user, err := utils.Users.GetByID(userID.(string))
		if err != nil {
			utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
			return
		}

		// Admin has access to all buckets
		if user.Role == schema.RoleAdmin {
			next.ServeHTTP(w, r)
			return
		}

		// Extract bucket name from path
		bucket := r.PathValue("bucket")
		if bucket == "" {
			// For list buckets endpoint, allow but filter results
			next.ServeHTTP(w, r)
			return
		}

		// Check bucket permission
		if !utils.Users.HasBucketPermission(user.ID, bucket) {
			utils.ResponseErrorStatus(w, errors.New("forbidden: no permission for this bucket"), http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// AdminOnlyMiddleware ensures only admin users can access the endpoint
func AdminOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := utils.Session.Get(r, "user_id")
		if userID == nil {
			utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
			return
		}

		user, err := utils.Users.GetByID(userID.(string))
		if err != nil || user.Role != schema.RoleAdmin {
			utils.ResponseErrorStatus(w, errors.New("forbidden: admin access required"), http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}
