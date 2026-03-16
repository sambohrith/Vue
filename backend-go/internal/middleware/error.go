package middleware

import (
	"net/http"

	"backend-go/pkg/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ErrorHandler 全局错误处理中间件
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// 检查是否有错误
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			
			logger.Error("请求处理错误",
				zap.String("path", c.Request.URL.Path),
				zap.String("method", c.Request.Method),
				zap.String("error", err.Error()),
			)

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "服务器内部错误",
				"requestId": c.GetString("requestID"),
			})
		}
	}
}

// NotFound 404处理
func NotFound() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "请求的接口不存在",
		})
	}
}

// Recovery 恢复panic中间件
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error("服务器发生panic",
					zap.Any("error", err),
					zap.String("path", c.Request.URL.Path),
					zap.String("method", c.Request.Method),
				)

				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "服务器内部错误",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}
