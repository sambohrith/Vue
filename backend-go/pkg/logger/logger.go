package logger

import (
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var log *zap.Logger

func Init(level, filename string, maxSize, maxBackups, maxAge int, compress bool) error {
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "timestamp",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "message",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	// 日志级别
	var zapLevel zapcore.Level
	switch level {
	case "debug":
		zapLevel = zapcore.DebugLevel
	case "warn":
		zapLevel = zapcore.WarnLevel
	case "error":
		zapLevel = zapcore.ErrorLevel
	default:
		zapLevel = zapcore.InfoLevel
	}

	// 文件输出
	fileWriter := zapcore.AddSync(&lumberjack.Logger{
		Filename:   filename,
		MaxSize:    maxSize,    // MB
		MaxBackups: maxBackups, // 保留的旧文件数量
		MaxAge:     maxAge,     // 保留天数
		Compress:   compress,   // 压缩
	})

	// 控制台输出
	consoleWriter := zapcore.AddSync(os.Stdout)

	// 创建多输出核心
	fileCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		fileWriter,
		zapLevel,
	)

	consoleCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(encoderConfig),
		consoleWriter,
		zapLevel,
	)

	// 合并核心
	core := zapcore.NewTee(fileCore, consoleCore)

	log = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))

	return nil
}

func GetLogger() *zap.Logger {
	if log == nil {
		// 默认配置
		Init("info", "./logs/app.log", 100, 30, 30, true)
	}
	return log
}

func Info(msg string, fields ...zap.Field) {
	GetLogger().Info(msg, fields...)
}

func Debug(msg string, fields ...zap.Field) {
	GetLogger().Debug(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	GetLogger().Warn(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	GetLogger().Error(msg, fields...)
}

func Fatal(msg string, fields ...zap.Field) {
	GetLogger().Fatal(msg, fields...)
}

// HTTPRequest 记录HTTP请求日志
func HTTPRequest(method, path string, status int, duration time.Duration, clientIP, userAgent string, userID uint) {
	fields := []zap.Field{
		zap.String("method", method),
		zap.String("path", path),
		zap.Int("status", status),
		zap.Duration("duration", duration),
		zap.String("client_ip", clientIP),
		zap.String("user_agent", userAgent),
	}
	if userID > 0 {
		fields = append(fields, zap.Uint("user_id", userID))
	}

	if status >= 400 {
		Warn("HTTP Request", fields...)
	} else {
		Info("HTTP Request", fields...)
	}
}

// Auth 记录认证相关日志
func Auth(action string, userID uint, success bool, fields ...zap.Field) {
	baseFields := []zap.Field{
		zap.String("action", action),
		zap.Uint("user_id", userID),
		zap.Bool("success", success),
	}
	baseFields = append(baseFields, fields...)

	if success {
		Info("Auth Success", baseFields...)
	} else {
		Warn("Auth Failed", baseFields...)
	}
}
