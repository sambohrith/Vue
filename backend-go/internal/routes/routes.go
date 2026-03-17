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
		
		// 临时修复用户数据接口（仅用于开发测试）
		public.GET("/fix-user-data", fixUserData)
		
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

		// 创建聊天处理器
		chatHandler := handlers.NewChatHandler()

		// 聊天
		chat := authorized.Group("/chat")
		{
			chat.GET("/list", chatHandler.GetChatList)
			chat.GET("/history/:userId", chatHandler.GetChatHistory)
			chat.POST("/send", chatHandler.SendMessage)
			chat.PUT("/read/:userId", chatHandler.MarkAsRead)
			chat.GET("/unread", chatHandler.GetUnreadCount)
			// 管理接口（兼容前端路径）
			chat.GET("/admin/messages", chatHandler.GetAllMessages)
			chat.GET("/admin/conversations", chatHandler.GetAllConversations)
		}

		// 创建社交处理器
		socialHandler := handlers.NewSocialHandler()

		// 社交
		social := authorized.Group("/social")
		{
			// 帖子
			posts := social.Group("/posts")
			{
				posts.GET("", socialHandler.GetPosts)
				posts.POST("", socialHandler.CreatePost)
				posts.GET("/:id", socialHandler.GetPosts)
				posts.PUT("/:id", placeholderHandler)
				posts.DELETE("/:id", socialHandler.DeletePost)
				posts.POST("/:id/like", socialHandler.ToggleLike)
				posts.POST("/:id/comment", socialHandler.AddComment)
			}

			// 创建房间处理器
			roomHandler := handlers.NewRoomHandler()

			// 房间
			rooms := social.Group("/rooms")
			{
				rooms.GET("/public", roomHandler.GetPublicRooms)
				rooms.GET("/my", roomHandler.GetMyRooms)
				rooms.POST("", roomHandler.CreateRoom)
				rooms.GET("/:id", roomHandler.GetRoom)
				rooms.PUT("/:id", placeholderHandler)
				rooms.DELETE("/:id", roomHandler.DeleteRoom)
				rooms.POST("/:id/join", roomHandler.JoinRoom)
				rooms.POST("/:id/leave", roomHandler.LeaveRoom)
				rooms.GET("/:id/members", roomHandler.GetRoomMembers)
				rooms.GET("/:id/messages", roomHandler.GetRoomMessages)
				rooms.POST("/:id/messages", roomHandler.SendRoomMessage)
			}
		}

		// 创建系统处理器
		systemHandler := handlers.NewSystemHandler()

		// 系统设置（管理员）
		system := authorized.Group("/system")
		system.Use(middleware.RoleAuth("admin"))
		{
			system.GET("/settings", systemHandler.GetSettings)
			system.PUT("/settings", systemHandler.UpdateSettings)
			system.POST("/backup", systemHandler.BackupDatabase)
		}

		// 临时填充测试数据接口（仅用于开发测试，需要登录）
		authorized.GET("/seed-data", seedData)
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

// fixUserData 修复用户数据（临时开发接口）
func fixUserData(c *gin.Context) {
	// 更新 admin 用户
	models.DB.Exec("UPDATE users SET full_name = ?, email = ? WHERE username = ?", "系统管理员", "admin@ims.com", "admin")
	
	// 为所有用户生成 fullName 和 email
	var users []models.User
	models.DB.Find(&users)
	
	for _, user := range users {
		updates := map[string]interface{}{}
		
		if user.FullName == "" {
			if len(user.Username) > 4 && user.Username[:4] == "user" {
				updates["full_name"] = "用户" + user.Username[4:]
			} else {
				updates["full_name"] = "用户" + string(rune(user.ID))
			}
		}
		
		if user.Email == "" {
			updates["email"] = user.Username + "@example.com"
		}
		
		if user.Department == "" {
			updates["department"] = "技术部"
		}
		
		if user.Position == "" {
			updates["position"] = "员工"
		}
		
		if user.Role == "" {
			updates["role"] = "user"
		}
		
		if len(updates) > 0 {
			models.DB.Model(&user).Updates(updates)
		}
	}
	
	c.JSON(200, gin.H{"success": true, "message": "用户数据修复完成"})
}

// seedData 填充测试数据（临时开发接口）
func seedData(c *gin.Context) {
	userID, _ := c.Get("userID")
	adminID := userID.(int64)

	// 获取随机用户ID用于创建数据
	var randomUsers []models.User
	models.DB.Where("id != ?", adminID).Limit(10).Find(&randomUsers)
	
	if len(randomUsers) == 0 {
		c.JSON(200, gin.H{"success": false, "message": "没有足够的用户来生成测试数据"})
		return
	}

	// 1. 创建测试帖子
	postContents := []string{
		"今天天气真不错，祝大家工作愉快！",
		"刚完成了一个新功能，感觉很有成就感 💪",
		"有人知道Go语言中channel的最佳实践吗？",
		"分享一个很好用的VS Code插件：GitLens",
		"周末团建活动，期待和大家一起玩！",
		"新版本的Vue3真的太好用了，推荐大家也试试",
		"今天学习了Docker容器化部署，收获满满",
		"有人在用Gin框架吗？求推荐中间件",
		"代码写得越多，越觉得设计模式的重要性",
		"祝大家新年快乐！🎉",
	}

	for i, content := range postContents {
		user := randomUsers[i%len(randomUsers)]
		post := models.Post{
			UserID:   user.ID,
			Content:  content,
			IsActive: true,
		}
		models.DB.Create(&post)
	}

	// 2. 创建测试房间
	roomData := []struct {
		Name        string
		Description string
		IsPublic    bool
	}{
		{"技术交流", "讨论各种技术话题的房间", true},
		{"日常闲聊", "工作之余放松一下", true},
		{"项目协作", "团队项目沟通专用", true},
		{"读书分享", "分享好书和阅读心得", true},
		{"音乐推荐", "发现好音乐的地方", true},
		{"美食探店", "分享美食和餐厅推荐", true},
	}

	for _, r := range roomData {
		owner := randomUsers[0]
		room := models.Room{
			Name:        r.Name,
			Description: r.Description,
			OwnerID:     owner.ID,
			IsActive:    r.IsPublic,
		}
		models.DB.Create(&room)

		// 房主自动加入
		member := models.RoomMember{
			RoomID: room.ID,
			UserID: owner.ID,
			Role:   "owner",
		}
		models.DB.Create(&member)

		// 添加其他成员
		for j := 1; j < len(randomUsers) && j < 5; j++ {
			member := models.RoomMember{
				RoomID: room.ID,
				UserID: randomUsers[j].ID,
				Role:   "member",
			}
			models.DB.Create(&member)
		}

		// 添加一些房间消息
		roomMessages := []string{
			"欢迎大家加入这个房间！",
			"这里氛围真不错 👍",
			"有人在线吗？",
			"今天有什么新话题吗？",
		}
		for k, msg := range roomMessages {
			message := models.RoomMessage{
				RoomID:   room.ID,
				SenderID: randomUsers[k%len(randomUsers)].ID,
				Content:  msg,
			}
			models.DB.Create(&message)
		}
	}

	// 3. 创建聊天消息
	for i := 0; i < 5 && i < len(randomUsers); i++ {
		for j := 0; j < 3; j++ {
			msg := models.ChatMessage{
				SenderID:   randomUsers[i].ID,
				ReceiverID: adminID,
				Content:    "你好，这是测试消息 " + string(rune('1'+j)),
				IsRead:     false,
			}
			models.DB.Create(&msg)
		}
	}

	c.JSON(200, gin.H{
		"success": true, 
		"message": "测试数据填充完成",
		"data": gin.H{
			"postsCreated": len(postContents),
			"roomsCreated": len(roomData),
		},
	})
}
