package router

import (
	"errors"
	"khairul169/garage-webui/middleware"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
)

func HandleApiRouter() *http.ServeMux {
	mux := http.NewServeMux()

	auth := &Auth{}
	mux.HandleFunc("POST /auth/login", auth.Login)

	router := http.NewServeMux()
	router.HandleFunc("POST /auth/logout", auth.Logout)
	router.HandleFunc("GET /auth/status", auth.GetStatus)

	config := &Config{}
	router.HandleFunc("GET /config", config.GetAll)

	// User management routes (admin only)
	users := &Users{}
	usersRouter := http.NewServeMux()
	usersRouter.HandleFunc("GET /users", users.GetAll)
	usersRouter.HandleFunc("GET /users/{id}", users.GetOne)
	usersRouter.HandleFunc("POST /users", users.Create)
	usersRouter.HandleFunc("PUT /users/{id}", users.Update)
	usersRouter.HandleFunc("DELETE /users/{id}", users.Delete)
	router.Handle("/users", middleware.AdminOnlyMiddleware(usersRouter))
	router.Handle("/users/", middleware.AdminOnlyMiddleware(usersRouter))

	// Bucket routes with permission checking
	buckets := &Buckets{}
	bucketsRouter := http.NewServeMux()
	bucketsRouter.HandleFunc("GET /buckets", buckets.GetAll)
	router.Handle("/buckets", middleware.BucketPermissionMiddleware(bucketsRouter))
	
	// Lifecycle routes - combine read and write handlers
	lifecycleHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		bucket := r.URL.Query().Get("bucket")
		userID := utils.Session.Get(r, "user_id")
		if userID == nil {
			utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
			return
		}

		user, _ := utils.Users.GetByID(userID.(string))
		isAdmin := user != nil && user.Role == schema.RoleAdmin

		switch r.Method {
		case "GET":
			// Read requires read permission
			if !isAdmin && !utils.Users.HasBucketPermissionDetailed(userID.(string), bucket, "read") {
				utils.ResponseErrorStatus(w, errors.New("forbidden"), http.StatusForbidden)
				return
			}
			buckets.GetLifecycleConfiguration(w, r)
		case "PUT", "DELETE":
			// Write/Delete requires manage_lifecycle permission
			if !isAdmin && !utils.Users.HasBucketPermissionDetailed(userID.(string), bucket, "manage_lifecycle") {
				utils.ResponseErrorStatus(w, errors.New("forbidden"), http.StatusForbidden)
				return
			}
			if r.Method == "PUT" {
				buckets.PutLifecycleConfiguration(w, r)
			} else {
				buckets.DeleteLifecycleConfiguration(w, r)
			}
		default:
			utils.ResponseErrorStatus(w, errors.New("method not allowed"), http.StatusMethodNotAllowed)
		}
	})
	router.Handle("/buckets/lifecycle", lifecycleHandler)

	// Browse routes with permission checking
	browse := &Browse{}
	browseRouter := http.NewServeMux()
	browseRouter.HandleFunc("GET /browse/{bucket}", browse.GetObjects)
	browseRouter.HandleFunc("GET /browse/{bucket}/{key...}", browse.GetOneObject)
	browseRouter.HandleFunc("PUT /browse/{bucket}/{key...}", browse.PutObject)
	browseRouter.HandleFunc("DELETE /browse/{bucket}/{key...}", browse.DeleteObject)
	
	// Multipart upload routes
	browseRouter.HandleFunc("POST /multipart/{bucket}/{key...}", browse.CreateMultipartUpload)
	browseRouter.HandleFunc("PUT /multipart/{bucket}/{key...}", browse.UploadPart)
	browseRouter.HandleFunc("POST /multipart/complete/{bucket}/{key...}", browse.CompleteMultipartUpload)
	browseRouter.HandleFunc("DELETE /multipart/{bucket}/{key...}", browse.AbortMultipartUpload)
	
	// Wrap with permission checking middleware
	browsePermissionHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Parse bucket from URL path manually since PathValue may not work before ServeMux routing
		path := r.URL.Path
		var bucket string
		
		// Extract bucket name from path
		if len(path) > len("/api/browse/") && (path[:len("/api/browse/")] == "/api/browse/" || path[:len("/browse/")] == "/browse/") {
			// Remove /api/browse/ or /browse/ prefix
			remaining := path[len("/api/browse/"):]
			if path[:len("/browse/")] == "/browse/" {
				remaining = path[len("/browse/"):]
			}
			// Get first segment as bucket name
			for i, ch := range remaining {
				if ch == '/' {
					bucket = remaining[:i]
					break
				}
			}
			if bucket == "" && remaining != "" {
				bucket = remaining
			}
		} else if len(path) > len("/api/multipart/") && (path[:len("/api/multipart/")] == "/api/multipart/" || path[:len("/multipart/")] == "/multipart/") {
			// Remove /api/multipart/ or /multipart/ prefix
			remaining := path[len("/api/multipart/"):]
			if path[:len("/multipart/")] == "/multipart/" {
				remaining = path[len("/multipart/"):]
			}
			// Handle /multipart/complete/ case
			if len(remaining) > len("complete/") && remaining[:len("complete/")] == "complete/" {
				remaining = remaining[len("complete/"):]
			}
			// Get first segment as bucket name
			for i, ch := range remaining {
				if ch == '/' {
					bucket = remaining[:i]
					break
				}
			}
			if bucket == "" && remaining != "" {
				bucket = remaining
			}
		}
		
		if bucket == "" {
			utils.ResponseErrorStatus(w, errors.New("bucket name required"), http.StatusBadRequest)
			return
		}
		
		userID := utils.Session.Get(r, "user_id")
		if userID == nil {
			utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
			return
		}

		user, _ := utils.Users.GetByID(userID.(string))
		isAdmin := user != nil && user.Role == schema.RoleAdmin

		// Check permission based on method
		var requiredPermission string
		switch r.Method {
		case "GET":
			requiredPermission = "read"
		case "PUT", "POST":
			requiredPermission = "write"
		case "DELETE":
			requiredPermission = "delete"
		default:
			utils.ResponseErrorStatus(w, errors.New("method not allowed"), http.StatusMethodNotAllowed)
			return
		}

		hasPermission := utils.Users.HasBucketPermissionDetailed(userID.(string), bucket, requiredPermission)
		
		if !isAdmin && !hasPermission {
			utils.ResponseErrorStatus(w, errors.New("forbidden: insufficient permissions"), http.StatusForbidden)
			return
		}
		
		browseRouter.ServeHTTP(w, r)
	})
	
	router.Handle("/browse/", browsePermissionHandler)
	router.Handle("/multipart/", browsePermissionHandler)

	// Proxy request to garage api endpoint (only v0, v1, v2 prefixes)
	router.HandleFunc("/v0/{path...}", ProxyHandler)
	router.HandleFunc("/v1/{path...}", ProxyHandler)
	
	// Admin-only routes for bucket management
	adminRouter := http.NewServeMux()
	adminRouter.HandleFunc("POST /v2/CreateBucket", ProxyHandler)
	adminRouter.HandleFunc("POST /v2/DeleteBucket", ProxyHandler)
	adminRouter.HandleFunc("POST /v2/UpdateBucket", ProxyHandler)
	adminRouter.HandleFunc("POST /v2/AddBucketAlias", ProxyHandler)
	adminRouter.HandleFunc("POST /v2/RemoveBucketAlias", ProxyHandler)
	adminRouter.HandleFunc("POST /v2/AllowBucketKey", ProxyHandler)
	adminRouter.HandleFunc("POST /v2/DenyBucketKey", ProxyHandler)
	router.Handle("/v2/CreateBucket", middleware.AdminOnlyMiddleware(adminRouter))
	router.Handle("/v2/DeleteBucket", middleware.AdminOnlyMiddleware(adminRouter))
	router.Handle("/v2/UpdateBucket", middleware.AdminOnlyMiddleware(adminRouter))
	router.Handle("/v2/AddBucketAlias", middleware.AdminOnlyMiddleware(adminRouter))
	router.Handle("/v2/RemoveBucketAlias", middleware.AdminOnlyMiddleware(adminRouter))
	router.Handle("/v2/AllowBucketKey", middleware.AdminOnlyMiddleware(adminRouter))
	router.Handle("/v2/DenyBucketKey", middleware.AdminOnlyMiddleware(adminRouter))
	
	// Other v2 routes (accessible to all authenticated users)
	router.HandleFunc("/v2/{path...}", ProxyHandler)

	mux.Handle("/", middleware.AuthMiddleware(router))
	return mux
}
