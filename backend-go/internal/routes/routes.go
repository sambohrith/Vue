package routes

import (
	"time"

	"backend-go/config"
	"backend-go/internal/handlers"
	"backend-go/internal/middleware"
	"backend-go/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置所有路由
func SetupRoutes(r *gin.Engine, cfg *config.Config) {
	// CORS配置
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.Server.AllowedOrigins
	corsConfig.AllowCredentials = true
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID"}
	r.Use(cors.New(corsConfig))

	// 创建服务实例
	authService := services.NewAuthService(cfg)
	
	// 创建处理器实例
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler()

	// 公开路由
	public := r.Group("/api")
	{
		// 健康检查
		public.GET("/health", healthCheck)
		
		// 认证路由
		auth := public.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
		}
	}

	// 需要认证的路由
	authorized := r.Group("/api")
	authorized.Use(middleware.JWTAuth())
	{
		// 认证相关
		auth := authorized.Group("/auth")
		{
			auth.POST("/logout", authHandler.Logout)
			auth.GET("/me", authHandler.GetMe)
			auth.GET("/profile", authHandler.GetProfile)
			auth.POST("/change-password", authHandler.ChangePassword)
		}

		// 用户管理（管理员）
		users := authorized.Group("/users")
		users.Use(middleware.RoleAuth("admin"))
		{
			users.GET("", userHandler.ListUsers)
			users.POST("", userHandler.CreateUser)
			users.GET("/stats", userHandler.GetUserStats)
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
			users.PATCH("/:id/toggle", userHandler.ToggleUserActive)
		}

		// 个人资料
		profile := authorized.Group("/profile")
		{
			profile.GET("", userHandler.GetMyInfo)
			profile.PUT("", userHandler.UpdateMyInfo)
		}

		// 仪表盘
		dashboard := authorized.Group("/dashboard")
		{
			dashboard.GET("/stats", userHandler.GetDashboardStats)
		}

		// 联系人
		contacts := authorized.Group("/contacts")
		{
			contacts.GET("", userHandler.GetAllContacts)
		}

		// 聊天
		chat := authorized.Group("/chat")
		{
			chat.GET("/messages/:userId", getChatMessages)
			chat.POST("/messages", sendMessage)
			chat.GET("/conversations", getConversations)
		}

		// 社交
		social := authorized.Group("/social")
		{
			// 帖子
			posts := social.Group("/posts")
			{
				posts.GET("", getPosts)
				posts.POST("", createPost)
				posts.GET("/:id", getPost)
				posts.PUT("/:id", updatePost)
				posts.DELETE("/:id", deletePost)
				posts.POST("/:id/like", likePost)
				posts.POST("/:id/comment", commentPost)
			}

			// 房间
			rooms := social.Group("/rooms")
			{
				rooms.GET("", getRooms)
				rooms.POST("", createRoom)
				rooms.GET("/:id", getRoom)
				rooms.PUT("/:id", updateRoom)
				rooms.DELETE("/:id", deleteRoom)
				rooms.POST("/:id/join", joinRoom)
				rooms.POST("/:id/leave", leaveRoom)
				rooms.GET("/:id/messages", getRoomMessages)
				rooms.POST("/:id/messages", sendRoomMessage)
			}
		}

		// 系统设置（管理员）
		system := authorized.Group("/system")
		system.Use(middleware.RoleAuth("admin"))
		{
			system.GET("/settings", getSettings)
			system.PUT("/settings", updateSettings)
		}
	}

	// 404处理
	r.NoRoute(middleware.NotFound())
}

// healthCheck 健康检查
func healthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"success":   true,
		"message":   "服务器运行正常",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// 占位符处理器（待实现）
func getChatMessages(c *gin.Context)    { c.JSON(200, gin.H{"success": true, "data": []}) }
func sendMessage(c *gin.Context)        { c.JSON(200, gin.H{"success": true}) }
func getConversations(c *gin.Context)   { c.JSON(200, gin.H{"success": true, "data": []}) }
func getPosts(c *gin.Context)           { c.JSON(200, gin.H{"success": true, "data": []}) }
func createPost(c *gin.Context)         { c.JSON(201, gin.H{"success": true}) }
func getPost(c *gin.Context)            { c.JSON(200, gin.H{"success": true}) }
func updatePost(c *gin.Context)         { c.JSON(200, gin.H{"success": true}) }
func deletePost(c *gin.Context)         { c.JSON(200, gin.H{"success": true}) }
func likePost(c *gin.Context)           { c.JSON(200, gin.H{"success": true}) }
func commentPost(c *gin.Context)        { c.JSON(201, gin.H{"success": true}) }
func getRooms(c *gin.Context)           { c.JSON(200, gin.H{"success": true, "data": []}) }
func createRoom(c *gin.Context)         { c.JSON(201, gin.H{"success": true}) }
func getRoom(c *gin.Context)            { c.JSON(200, gin.H{"success": true}) }
func updateRoom(c *gin.Context)         { c.JSON(200, gin.H{"success": true}) }
func deleteRoom(c *gin.Context)         { c.JSON(200, gin.H{"success": true}) }
func joinRoom(c *gin.Context)           { c.JSON(200, gin.H{"success": true}) }
func leaveRoom(c *gin.Context)          { c.JSON(200, gin.H{"success": true}) }
func getRoomMessages(c *gin.Context)    { c.JSON(200, gin.H{"success": true, "data": []}) }
func sendRoomMessage(c *gin.Context)    { c.JSON(201, gin.H{"success": true}) }
func getSettings(c *gin.Context)        { c.JSON(200, gin.H{"success": true, "data": {}}) }
func updateSettings(c *gin.Context)     { c.JSON(200, gin.H{"success": true}) }


