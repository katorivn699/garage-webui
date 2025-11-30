package schema

import "time"

type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleUser  UserRole = "user"
)

type User struct {
	ID             string         `json:"id"`
	Username       string         `json:"username"`
	PasswordHash   string         `json:"-"`
	Role           UserRole       `json:"role"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	BucketPermissions []string    `json:"bucket_permissions"`
}

type CreateUserRequest struct {
	Username string   `json:"username"`
	Password string   `json:"password"`
	Role     UserRole `json:"role"`
	BucketPermissions []string `json:"bucket_permissions"`
}

type UpdateUserRequest struct {
	Password string   `json:"password,omitempty"`
	Role     UserRole `json:"role,omitempty"`
	BucketPermissions []string `json:"bucket_permissions,omitempty"`
}

type UserResponse struct {
	ID             string         `json:"id"`
	Username       string         `json:"username"`
	Role           UserRole       `json:"role"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	BucketPermissions []string    `json:"bucket_permissions"`
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
