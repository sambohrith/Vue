package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server     ServerConfig     `mapstructure:"server"`
	JWT        JWTConfig        `mapstructure:"jwt"`
	Database   DatabaseConfig   `mapstructure:"database"`
	SQLite     SQLiteConfig     `mapstructure:"sqlite"`
	Log        LogConfig        `mapstructure:"log"`
	RateLimit  RateLimitConfig  `mapstructure:"rate_limit"`
	Admin      AdminConfig      `mapstructure:"admin"`
}

type ServerConfig struct {
	Port           int      `mapstructure:"port"`
	Mode           string   `mapstructure:"mode"`
	AllowedOrigins []string `mapstructure:"allowed_origins"`
}

type JWTConfig struct {
	Secret     string `mapstructure:"secret"`
	Expiration string `mapstructure:"expiration"`
}

type DatabaseConfig struct {
	Driver          string `mapstructure:"driver"`
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	Name            string `mapstructure:"name"`
	User            string `mapstructure:"user"`
	Password        string `mapstructure:"password"`
	Charset         string `mapstructure:"charset"`
	ParseTime       bool   `mapstructure:"parse_time"`
	Loc             string `mapstructure:"loc"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`
}

type SQLiteConfig struct {
	Path string `mapstructure:"path"`
}

type LogConfig struct {
	Level      string `mapstructure:"level"`
	Filename   string `mapstructure:"filename"`
	MaxSize    int    `mapstructure:"max_size"`
	MaxBackups int    `mapstructure:"max_backups"`
	MaxAge     int    `mapstructure:"max_age"`
	Compress   bool   `mapstructure:"compress"`
}

type RateLimitConfig struct {
	Enabled           bool `mapstructure:"enabled"`
	RequestsPerMinute int  `mapstructure:"requests_per_minute"`
	Burst             int  `mapstructure:"burst"`
}

type AdminConfig struct {
	DefaultUsername string `mapstructure:"default_username"`
	DefaultPassword string `mapstructure:"default_password"`
	DefaultEmail    string `mapstructure:"default_email"`
}

func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AddConfigPath(".")

	// 设置默认值
	viper.SetDefault("server.port", 3001)
	viper.SetDefault("server.mode", "development")
	viper.SetDefault("database.driver", "mysql")
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 3306)
	viper.SetDefault("database.charset", "utf8mb4")
	viper.SetDefault("jwt.expiration", "24h")
	viper.SetDefault("log.level", "info")

	// 环境变量覆盖
	viper.SetEnvPrefix("IMS")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("读取配置文件失败: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("解析配置失败: %w", err)
	}

	return &config, nil
}

func (d *DatabaseConfig) DSN() string {
	switch d.Driver {
	case "postgres":
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
			d.Host, d.Port, d.User, d.Password, d.Name)
	case "sqlite":
		return ""
	default: // mysql
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=%v&loc=%s",
			d.User, d.Password, d.Host, d.Port, d.Name, d.Charset, d.ParseTime, d.Loc)
	}
}
