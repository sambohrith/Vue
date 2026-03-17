package middleware

import (
	"time"

	"backend-go/pkg/logger"

	"github.com/gin-gonic/gin"
)

// Logger 请求日志中间件
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// 处理请求
		c.Next()

		// 计算耗时
		duration := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		userAgent := c.Request.UserAgent()
		
		if raw != "" {
			path = path + "?" + raw
		}

		// 获取用户ID
		var userID int64
		if uid, exists := c.Get("userID"); exists {
			if id, ok := uid.(int64); ok {
				userID = id
			}
		}

		logger.HTTPRequest(method, path, status, duration, clientIP, userAgent, userID)
	}
}

// RequestID 请求ID中间件
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}
		
		c.Set("requestID", requestID)
		c.Writer.Header().Set("X-Request-ID", requestID)
		c.Next()
	}
}

func generateRequestID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(result)
}
