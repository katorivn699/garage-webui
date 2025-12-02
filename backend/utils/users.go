package utils

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"khairul169/garage-webui/schema"
	"os"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserStore struct {
	mu    sync.RWMutex
	users map[string]*schema.User
	file  string
}

var Users *UserStore

func InitUserStore() error {
	store := &UserStore{
		users: make(map[string]*schema.User),
		file:  "users.json",
	}

	// Load users from file
	if err := store.load(); err != nil && !os.IsNotExist(err) {
		return err
	}

	// Create default admin if no users exist
	if len(store.users) == 0 {
		adminPass := GetEnv("ADMIN_PASSWORD", "admin")
		hash, err := bcrypt.GenerateFromPassword([]byte(adminPass), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		id, _ := generateID()
		admin := &schema.User{
			ID:           id,
			Username:     "admin",
			PasswordHash: string(hash),
			Role:         schema.RoleAdmin,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
			BucketPermissions: []*schema.BucketPermission{},
		}
		store.users[id] = admin
		store.save()
	}

	Users = store
	return nil
}

func (s *UserStore) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.file)
	if err != nil {
		return err
	}

	// First try to unmarshal with new format
	var users []*schema.User
	if err := json.Unmarshal(data, &users); err != nil {
		// If failed, try legacy format and migrate
		var legacyUsers []map[string]interface{}
		if err := json.Unmarshal(data, &legacyUsers); err != nil {
			return err
		}

		// Convert legacy format to new format
		for _, legacyUser := range legacyUsers {
			user := &schema.User{
				ID:           legacyUser["id"].(string),
				Username:     legacyUser["username"].(string),
				PasswordHash: legacyUser["password_hash"].(string),
				Role:         schema.UserRole(legacyUser["role"].(string)),
			}

			// Parse timestamps
			if createdAt, ok := legacyUser["created_at"].(string); ok {
				if t, err := time.Parse(time.RFC3339, createdAt); err == nil {
					user.CreatedAt = t
				}
			}
			if updatedAt, ok := legacyUser["updated_at"].(string); ok {
				if t, err := time.Parse(time.RFC3339, updatedAt); err == nil {
					user.UpdatedAt = t
				}
			}

			// Convert old bucket_permissions (string array) to new format (object array)
			user.BucketPermissions = []*schema.BucketPermission{}
			if perms, ok := legacyUser["bucket_permissions"].([]interface{}); ok {
				for _, perm := range perms {
					if bucketName, ok := perm.(string); ok {
						// Create permission with all rights for existing permissions
						user.BucketPermissions = append(user.BucketPermissions, &schema.BucketPermission{
							BucketName:      bucketName,
							Read:            true,
							Write:           true,
							Delete:          true,
							ManageLifecycle: true,
							DeleteBucket:    false, // Don't grant delete bucket by default
						})
					}
				}
			}

			users = append(users, user)
		}
	}

	needsSave := false
	for _, user := range users {
		// If user doesn't have password hash, set default password
		if user.PasswordHash == "" {
			defaultPass := "admin"
			if user.Username != "admin" {
				defaultPass = user.Username
			}
			hash, err := bcrypt.GenerateFromPassword([]byte(defaultPass), bcrypt.DefaultCost)
			if err != nil {
				return err
			}
			user.PasswordHash = string(hash)
			needsSave = true
		}

		// Ensure BucketPermissions is initialized
		if user.BucketPermissions == nil {
			user.BucketPermissions = []*schema.BucketPermission{}
			needsSave = true
		}

		s.users[user.ID] = user
	}

	// Save if we migrated or added password hashes
	if needsSave {
		s.save()
	}

	return nil
}

func (s *UserStore) save() error {
	users := make([]*schema.User, 0, len(s.users))
	for _, user := range s.users {
		users = append(users, user)
	}

	data, err := json.MarshalIndent(users, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.file, data, 0644)
}

func (s *UserStore) GetAll() []*schema.User {
	s.mu.RLock()
	defer s.mu.RUnlock()

	users := make([]*schema.User, 0, len(s.users))
	for _, user := range s.users {
		users = append(users, user)
	}
	return users
}

func (s *UserStore) GetByID(id string) (*schema.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, ok := s.users[id]
	if !ok {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *UserStore) GetByUsername(username string) (*schema.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, user := range s.users {
		if user.Username == username {
			return user, nil
		}
	}
	return nil, errors.New("user not found")
}

func (s *UserStore) Create(req *schema.CreateUserRequest) (*schema.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check if username exists
	for _, user := range s.users {
		if user.Username == req.Username {
			return nil, errors.New("username already exists")
		}
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	id, err := generateID()
	if err != nil {
		return nil, err
	}

	user := &schema.User{
		ID:           id,
		Username:     req.Username,
		PasswordHash: string(hash),
		Role:         req.Role,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		BucketPermissions: req.BucketPermissions,
	}

	if user.BucketPermissions == nil {
		user.BucketPermissions = []*schema.BucketPermission{}
	}

	s.users[id] = user
	s.save()

	return user, nil
}

func (s *UserStore) Update(id string, req *schema.UpdateUserRequest) (*schema.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, ok := s.users[id]
	if !ok {
		return nil, errors.New("user not found")
	}

	// Update password if provided
	if req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.PasswordHash = string(hash)
	}

	// Update role if provided
	if req.Role != "" {
		user.Role = req.Role
	}

	// Update bucket permissions if provided
	if req.BucketPermissions != nil {
		user.BucketPermissions = req.BucketPermissions
	}

	user.UpdatedAt = time.Now()
	s.save()

	return user, nil
}

func (s *UserStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, ok := s.users[id]
	if !ok {
		return errors.New("user not found")
	}

	// Prevent deleting the last admin
	if user.Role == schema.RoleAdmin {
		adminCount := 0
		for _, u := range s.users {
			if u.Role == schema.RoleAdmin {
				adminCount++
			}
		}
		if adminCount <= 1 {
			return errors.New("cannot delete the last admin user")
		}
	}

	delete(s.users, id)
	s.save()

	return nil
}

func (s *UserStore) ValidateCredentials(username, password string) (*schema.User, error) {
	user, err := s.GetByUsername(username)
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid username or password")
	}

	return user, nil
}

func (s *UserStore) HasBucketPermission(userID, bucket string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, ok := s.users[userID]
	if !ok {
		return false
	}

	// Admin has access to all buckets
	if user.Role == schema.RoleAdmin {
		return true
	}

	// Check if user has permission for this bucket
	for _, perm := range user.BucketPermissions {
		if perm.BucketName == bucket || perm.BucketName == "*" {
			return true
		}
	}

	return false
}

// HasBucketPermissionDetailed checks if user has specific permission for a bucket
func (s *UserStore) HasBucketPermissionDetailed(userID, bucket, action string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, ok := s.users[userID]
	if !ok {
		return false
	}

	// Admin has full access to all buckets
	if user.Role == schema.RoleAdmin {
		return true
	}

	// Check if user has specific permission for this bucket
	for _, perm := range user.BucketPermissions {
		if perm.BucketName == bucket || perm.BucketName == "*" {
			switch action {
			case "read":
				return perm.Read
			case "write":
				return perm.Write
			case "delete":
				return perm.Delete
			case "manage_lifecycle":
				return perm.ManageLifecycle
			case "delete_bucket":
				return perm.DeleteBucket
			default:
				return false
			}
		}
	}

	return false
}

func generateID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
