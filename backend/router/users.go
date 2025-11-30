package router

import (
	"encoding/json"
	"errors"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
)

type Users struct{}

func (c *Users) GetAll(w http.ResponseWriter, r *http.Request) {
	// Check if user is admin
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

	users := utils.Users.GetAll()
	responses := make([]*schema.UserResponse, 0, len(users))
	for _, u := range users {
		responses = append(responses, u.ToResponse())
	}

	utils.ResponseSuccess(w, responses)
}

func (c *Users) GetOne(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.ResponseErrorStatus(w, errors.New("user id required"), http.StatusBadRequest)
		return
	}

	// Check if user is admin or requesting their own data
	userID := utils.Session.Get(r, "user_id")
	if userID == nil {
		utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
		return
	}

	currentUser, err := utils.Users.GetByID(userID.(string))
	if err != nil {
		utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
		return
	}

	if currentUser.Role != schema.RoleAdmin && userID.(string) != id {
		utils.ResponseErrorStatus(w, errors.New("forbidden"), http.StatusForbidden)
		return
	}

	user, err := utils.Users.GetByID(id)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, user.ToResponse())
}

func (c *Users) Create(w http.ResponseWriter, r *http.Request) {
	// Check if user is admin
	userID := utils.Session.Get(r, "user_id")
	if userID == nil {
		utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
		return
	}

	currentUser, err := utils.Users.GetByID(userID.(string))
	if err != nil || currentUser.Role != schema.RoleAdmin {
		utils.ResponseErrorStatus(w, errors.New("forbidden: admin access required"), http.StatusForbidden)
		return
	}

	var req schema.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate request
	if req.Username == "" || req.Password == "" {
		utils.ResponseErrorStatus(w, errors.New("username and password are required"), http.StatusBadRequest)
		return
	}

	if req.Role != schema.RoleAdmin && req.Role != schema.RoleUser {
		req.Role = schema.RoleUser
	}

	user, err := utils.Users.Create(&req)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, user.ToResponse())
}

func (c *Users) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.ResponseErrorStatus(w, errors.New("user id required"), http.StatusBadRequest)
		return
	}

	// Check if user is admin or updating their own data
	userID := utils.Session.Get(r, "user_id")
	if userID == nil {
		utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
		return
	}

	currentUser, err := utils.Users.GetByID(userID.(string))
	if err != nil {
		utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
		return
	}

	isAdmin := currentUser.Role == schema.RoleAdmin
	isSelf := userID.(string) == id

	if !isAdmin && !isSelf {
		utils.ResponseErrorStatus(w, errors.New("forbidden"), http.StatusForbidden)
		return
	}

	var req schema.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Non-admin users can only update their own password
	if !isAdmin {
		req.Role = ""
		req.BucketPermissions = nil
	}

	user, err := utils.Users.Update(id, &req)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, user.ToResponse())
}

func (c *Users) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.ResponseErrorStatus(w, errors.New("user id required"), http.StatusBadRequest)
		return
	}

	// Check if user is admin
	userID := utils.Session.Get(r, "user_id")
	if userID == nil {
		utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
		return
	}

	currentUser, err := utils.Users.GetByID(userID.(string))
	if err != nil || currentUser.Role != schema.RoleAdmin {
		utils.ResponseErrorStatus(w, errors.New("forbidden: admin access required"), http.StatusForbidden)
		return
	}

	// Prevent users from deleting themselves
	if userID.(string) == id {
		utils.ResponseErrorStatus(w, errors.New("cannot delete your own account"), http.StatusBadRequest)
		return
	}

	if err := utils.Users.Delete(id); err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, map[string]bool{"success": true})
}
