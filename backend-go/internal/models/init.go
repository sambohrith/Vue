package models

import (
	"fmt"
	"time"

	"backend-go/config"

	"go.uber.org/zap"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase 初始化数据库连接
func InitDatabase(cfg *config.Config, log *zap.Logger) error {
	var dialector gorm.Dialector

	switch cfg.Database.Driver {
	case "postgres":
		dialector = postgres.Open(cfg.Database.DSN())
	case "sqlite":
		dialector = sqlite.Open(cfg.SQLite.Path)
	default: // mysql
		dialector = mysql.Open(cfg.Database.DSN())
	}

	// 配置GORM日志
	gormLogLevel := logger.Silent
	if cfg.Server.Mode == "development" {
		gormLogLevel = logger.Info
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(gormLogLevel),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return fmt.Errorf("连接数据库失败: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("获取数据库实例失败: %w", err)
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxLifetime) * time.Second)

	DB = db
	log.Info("数据库连接成功", zap.String("driver", cfg.Database.Driver))
	return nil
}

// AutoMigrate 自动迁移数据库表
func AutoMigrate() error {
	// 先删除云端数据库中不兼容的外键约束
	tables := []string{"chat_messages", "rooms", "room_members", "room_messages", "posts", "post_likes", "post_comments"}
	for _, table := range tables {
		var constraints []string
		DB.Raw(`SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
			WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' AND TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, table).Scan(&constraints)
		for _, constraint := range constraints {
			DB.Exec(fmt.Sprintf("ALTER TABLE %s DROP FOREIGN KEY %s", table, constraint))
		}
	}
	
	return DB.AutoMigrate(
		&User{},
		&ChatMessage{},
		&Room{},
		&RoomMember{},
		&RoomMessage{},
		&Post{},
		&PostLike{},
		&PostComment{},
		&SystemSettings{},
	)
}

// CreateDefaultAdmin 创建默认管理员账号
func CreateDefaultAdmin(cfg *config.Config, log *zap.Logger) error {
	var existingUser User
	result := DB.Where("username = ?", cfg.Admin.DefaultUsername).First(&existingUser)
	
	if result.Error == nil {
		log.Info("管理员账号已存在")
		return nil
	}

	admin := User{
		Username: cfg.Admin.DefaultUsername,
		Email:    cfg.Admin.DefaultEmail,
		Password: cfg.Admin.DefaultPassword,
		FullName: "系统管理员",
		Role:     "admin",
		IsActive: true,
	}

	if err := DB.Create(&admin).Error; err != nil {
		return fmt.Errorf("创建默认管理员失败: %w", err)
	}

	log.Info("默认管理员账号创建成功",
		zap.String("username", cfg.Admin.DefaultUsername),
		zap.String("email", cfg.Admin.DefaultEmail),
	)
	
	return nil
}

// CloseDatabase 关闭数据库连接
func CloseDatabase() error {
	if DB == nil {
		return nil
	}
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
