package schema

import "time"

type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleUser  UserRole = "user"
)

// BucketPermission defines detailed permissions for a bucket
type BucketPermission struct {
	BucketName      string `json:"bucket_name"`
	Read            bool   `json:"read"`             // View and download files
	Write           bool   `json:"write"`            // Upload and create files/folders
	Delete          bool   `json:"delete"`           // Delete files and folders
	ManageLifecycle bool   `json:"manage_lifecycle"` // Add/edit/delete lifecycle rules
	DeleteBucket    bool   `json:"delete_bucket"`    // Delete the bucket itself
}

type User struct {
	ID                string              `json:"id"`
	Username          string              `json:"username"`
	PasswordHash      string              `json:"password_hash,omitempty"`
	Role              UserRole            `json:"role"`
	CreatedAt         time.Time           `json:"created_at"`
	UpdatedAt         time.Time           `json:"updated_at"`
	BucketPermissions []*BucketPermission `json:"bucket_permissions"`
}

type CreateUserRequest struct {
	Username          string              `json:"username"`
	Password          string              `json:"password"`
	Role              UserRole            `json:"role"`
	BucketPermissions []*BucketPermission `json:"bucket_permissions"`
}

type UpdateUserRequest struct {
	Password          string              `json:"password,omitempty"`
	Role              UserRole            `json:"role,omitempty"`
	BucketPermissions []*BucketPermission `json:"bucket_permissions,omitempty"`
}

type UserResponse struct {
	ID                string              `json:"id"`
	Username          string              `json:"username"`
	Role              UserRole            `json:"role"`
	CreatedAt         time.Time           `json:"created_at"`
	UpdatedAt         time.Time           `json:"updated_at"`
	BucketPermissions []*BucketPermission `json:"bucket_permissions"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:                u.ID,
		Username:          u.Username,
		Role:              u.Role,
		CreatedAt:         u.CreatedAt,
		UpdatedAt:         u.UpdatedAt,
		BucketPermissions: u.BucketPermissions,
	}
}
