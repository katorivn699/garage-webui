package router

import (
	"khairul169/garage-webui/middleware"
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
	bucketsRouter.HandleFunc("GET /buckets/lifecycle", buckets.GetLifecycleConfiguration)
	bucketsRouter.HandleFunc("PUT /buckets/lifecycle", buckets.PutLifecycleConfiguration)
	bucketsRouter.HandleFunc("DELETE /buckets/lifecycle", buckets.DeleteLifecycleConfiguration)
	router.Handle("/buckets", middleware.BucketPermissionMiddleware(bucketsRouter))
	router.Handle("/buckets/", middleware.BucketPermissionMiddleware(bucketsRouter))

	// Browse routes with permission checking
	browse := &Browse{}
	browseRouter := http.NewServeMux()
	browseRouter.HandleFunc("GET /browse/{bucket}", browse.GetObjects)
	browseRouter.HandleFunc("GET /browse/{bucket}/{key...}", browse.GetOneObject)
	browseRouter.HandleFunc("PUT /browse/{bucket}/{key...}", browse.PutObject)
	browseRouter.HandleFunc("DELETE /browse/{bucket}/{key...}", browse.DeleteObject)
	router.Handle("/browse/", middleware.BucketPermissionMiddleware(browseRouter))

	// Proxy request to garage api endpoint (only v0, v1, v2 prefixes)
	router.HandleFunc("/v0/{path...}", ProxyHandler)
	router.HandleFunc("/v1/{path...}", ProxyHandler)
	router.HandleFunc("/v2/{path...}", ProxyHandler)

	mux.Handle("/", middleware.AuthMiddleware(router))
	return mux
}
