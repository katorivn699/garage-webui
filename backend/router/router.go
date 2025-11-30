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

	buckets := &Buckets{}
	router.HandleFunc("GET /buckets", buckets.GetAll)
	router.HandleFunc("GET /buckets/lifecycle", buckets.GetLifecycleConfiguration)
	router.HandleFunc("PUT /buckets/lifecycle", buckets.PutLifecycleConfiguration)
	router.HandleFunc("DELETE /buckets/lifecycle", buckets.DeleteLifecycleConfiguration)

	browse := &Browse{}
	router.HandleFunc("GET /browse/{bucket}", browse.GetObjects)
	router.HandleFunc("GET /browse/{bucket}/{key...}", browse.GetOneObject)
	router.HandleFunc("PUT /browse/{bucket}/{key...}", browse.PutObject)
	router.HandleFunc("DELETE /browse/{bucket}/{key...}", browse.DeleteObject)

	// Proxy request to garage api endpoint (only v0, v1, v2 prefixes)
	router.HandleFunc("/v0/{path...}", ProxyHandler)
	router.HandleFunc("/v1/{path...}", ProxyHandler)
	router.HandleFunc("/v2/{path...}", ProxyHandler)

	mux.Handle("/", middleware.AuthMiddleware(router))
	return mux
}
