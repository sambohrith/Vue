package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend-go/config"
	"backend-go/internal/middleware"
	"backend-go/internal/models"
	"backend-go/internal/routes"
	"backend-go/pkg/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("加载配置失败: %v\n", err)
		os.Exit(1)
	}

	// 初始化日志
	if err := logger.Init(
		cfg.Log.Level,
		cfg.Log.Filename,
		cfg.Log.MaxSize,
		cfg.Log.MaxBackups,
		cfg.Log.MaxAge,
		cfg.Log.Compress,
	); err != nil {
		fmt.Printf("初始化日志失败: %v\n", err)
		os.Exit(1)
	}
	defer logger.GetLogger().Sync()

	log := logger.GetLogger()
	log.Info("服务启动中...",
		zap.String("version", "1.0.0"),
		zap.String("environment", cfg.Server.Mode),
	)

	// 初始化JWT
	if err := middleware.InitJWT(cfg.JWT.Secret, cfg.JWT.Expiration); err != nil {
		log.Fatal("初始化JWT失败", zap.Error(err))
	}

	// 初始化数据库
	if err := models.InitDatabase(cfg, log); err != nil {
		log.Fatal("初始化数据库失败", zap.Error(err))
	}
	defer models.CloseDatabase()

	// 自动迁移数据库
	if err := models.AutoMigrate(); err != nil {
		log.Fatal("数据库迁移失败", zap.Error(err))
	}
	log.Info("数据库迁移完成")

	// 创建默认管理员
	if err := models.CreateDefaultAdmin(cfg, log); err != nil {
		log.Error("创建默认管理员失败", zap.Error(err))
	}

	// 设置Gin模式
	if cfg.Server.Mode == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	r := gin.New()

	// 注册中间件
	r.Use(middleware.Recovery())
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(middleware.ErrorHandler())

	// 限流中间件
	if cfg.RateLimit.Enabled {
		rateLimiter := middleware.NewRateLimiter(cfg.RateLimit.RequestsPerMinute, cfg.RateLimit.Burst)
		r.Use(rateLimiter.Middleware())
	}

	// 设置路由
	routes.SetupRoutes(r, cfg)

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Server.Port),
		Handler: r,
	}

	// 优雅关闭
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		log.Info("正在关闭服务器...")

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			log.Error("服务器关闭失败", zap.Error(err))
		}
	}()

	// 启动服务器
	log.Info("服务器启动成功",
		zap.Int("port", cfg.Server.Port),
		zap.String("mode", cfg.Server.Mode),
	)

	fmt.Printf(`
=================================
🚀 服务器启动成功！
=================================
📍 本地访问地址:
   • http://localhost:%d
   • http://127.0.0.1:%d

📊 API 地址:
   • http://localhost:%d/api
   • http://localhost:%d/api/health
=================================
`, cfg.Server.Port, cfg.Server.Port, cfg.Server.Port, cfg.Server.Port)

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("服务器启动失败", zap.Error(err))
	}

	log.Info("服务器已关闭")
}
