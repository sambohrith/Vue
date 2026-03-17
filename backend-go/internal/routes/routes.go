package routes

import (
	"time"

	"backend-go/config"
	"backend-go/internal/handlers"
	"backend-go/internal/middleware"
	"backend-go/internal/models"
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
		
		// 临时重置密码接口（仅用于开发测试）
		public.GET("/reset-admin", resetAdminPassword)
		
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

		// 用户自己信息（兼容前端路径）
		authorized.GET("/users/me", userHandler.GetMyInfo)
		authorized.PUT("/users/me", userHandler.UpdateMyInfo)

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

		// 联系人（兼容前端路径）
		authorized.GET("/users/contacts", userHandler.GetAllContacts)

		// 聊天
		chat := authorized.Group("/chat")
		{
			chat.GET("/messages/:userId", placeholderHandler)
			chat.POST("/messages", placeholderHandler)
			chat.GET("/conversations", placeholderHandler)
			// 管理接口（兼容前端路径）
			chat.GET("/admin/messages", placeholderHandler)
			chat.GET("/admin/conversations", placeholderHandler)
		}

		// 社交
		social := authorized.Group("/social")
		{
			// 帖子
			posts := social.Group("/posts")
			{
				posts.GET("", placeholderHandler)
				posts.POST("", placeholderHandler)
				posts.GET("/:id", placeholderHandler)
				posts.PUT("/:id", placeholderHandler)
				posts.DELETE("/:id", placeholderHandler)
				posts.POST("/:id/like", placeholderHandler)
				posts.POST("/:id/comment", placeholderHandler)
			}

			// 房间
			rooms := social.Group("/rooms")
			{
				rooms.GET("", placeholderHandler)
				rooms.POST("", placeholderHandler)
				rooms.GET("/:id", placeholderHandler)
				rooms.PUT("/:id", placeholderHandler)
				rooms.DELETE("/:id", placeholderHandler)
				rooms.POST("/:id/join", placeholderHandler)
				rooms.POST("/:id/leave", placeholderHandler)
				rooms.GET("/:id/messages", placeholderHandler)
				rooms.POST("/:id/messages", placeholderHandler)
			}
		}

		// 系统设置（管理员）
		system := authorized.Group("/system")
		system.Use(middleware.RoleAuth("admin"))
		{
			system.GET("/settings", placeholderHandler)
			system.PUT("/settings", placeholderHandler)
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

// placeholderHandler 占位符处理器
func placeholderHandler(c *gin.Context) {
	c.JSON(200, gin.H{
		"success": true,
		"data":    []interface{}{},
	})
}

// resetAdminPassword 临时重置admin密码（仅用于开发测试）
func resetAdminPassword(c *gin.Context) {
	var user models.User
	if err := models.DB.Where("username = ?", "admin").First(&user).Error; err != nil {
		c.JSON(200, gin.H{"success": false, "message": "admin用户不存在"})
		return
	}
	
	user.Password = "admin123"
	if err := models.DB.Save(&user).Error; err != nil {
		c.JSON(200, gin.H{"success": false, "message": "重置失败: " + err.Error()})
		return
	}
	
	c.JSON(200, gin.H{"success": true, "message": "admin密码已重置为 admin123"})
}
