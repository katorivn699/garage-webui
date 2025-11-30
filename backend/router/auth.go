package router

import (
	"encoding/json"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
)

type Auth struct{}

func (c *Auth) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate credentials using user store
	user, err := utils.Users.ValidateCredentials(body.Username, body.Password)
	if err != nil {
		utils.ResponseErrorStatus(w, err, http.StatusUnauthorized)
		return
	}

	// Set session data
	utils.Session.Set(r, "authenticated", true)
	utils.Session.Set(r, "user_id", user.ID)
	utils.Session.Set(r, "username", user.Username)
	utils.Session.Set(r, "role", string(user.Role))

	utils.ResponseSuccess(w, map[string]interface{}{
		"authenticated": true,
		"user":          user.ToResponse(),
	})
}

func (c *Auth) Logout(w http.ResponseWriter, r *http.Request) {
	utils.Session.Clear(r)
	utils.ResponseSuccess(w, true)
}

func (c *Auth) GetStatus(w http.ResponseWriter, r *http.Request) {
	isAuthenticated := false
	authSession := utils.Session.Get(r, "authenticated")
	var currentUser *schema.UserResponse = nil

	if authSession != nil && authSession.(bool) {
		isAuthenticated = true
		userID := utils.Session.Get(r, "user_id")
		if userID != nil {
			user, err := utils.Users.GetByID(userID.(string))
			if err == nil {
				currentUser = user.ToResponse()
			}
		}
	}

	utils.ResponseSuccess(w, map[string]interface{}{
		"enabled":       true,
		"authenticated": isAuthenticated,
		"user":          currentUser,
	})
}
