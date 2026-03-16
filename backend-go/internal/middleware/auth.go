package middleware

import (
	"net/http"
	"strings"
	"time"

	"backend-go/internal/models"
	"backend-go/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWTConfig struct {
	Secret     string
	Expiration time.Duration
}

var jwtConfig *JWTConfig

// InitJWT 初始化JWT配置
func InitJWT(secret string, expiration string) error {
	duration, err := time.ParseDuration(expiration)
	if err != nil {
		duration = 24 * time.Hour
	}
	
	jwtConfig = &JWTConfig{
		Secret:     secret,
		Expiration: duration,
	}
	return nil
}

// GenerateToken 生成JWT令牌
func GenerateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(jwtConfig.Expiration).Unix(),
		"iat":     time.Now().Unix(),
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtConfig.Secret))
}

// ParseToken 解析JWT令牌
func ParseToken(tokenString string) (*jwt.Token, jwt.MapClaims, error) {
	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(jwtConfig.Secret), nil
	})
	
	return token, claims, err
}

// JWTAuth JWT认证中间件
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "未提供认证令牌",
			})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "认证格式错误",
			})
			c.Abort()
			return
		}

		token, claims, err := ParseToken(parts[1])
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "无效的令牌",
			})
			c.Abort()
			return
		}

		// 获取用户ID
		userID, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "无效的令牌 claims",
			})
			c.Abort()
			return
		}

		// 查询用户信息
		var user models.User
		if err := models.DB.First(&user, uint(userID)).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "用户不存在",
			})
			c.Abort()
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "账户已被禁用",
			})
			c.Abort()
			return
		}

		// 将用户信息存入上下文
		c.Set("user", &user)
		c.Set("userID", user.ID)
		c.Next()
	}
}

// OptionalAuth 可选认证中间件
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		token, claims, err := ParseToken(parts[1])
		if err != nil || !token.Valid {
			c.Next()
			return
		}

		userID, ok := claims["user_id"].(float64)
		if !ok {
			c.Next()
			return
		}

		var user models.User
		if err := models.DB.First(&user, uint(userID)).Error; err != nil {
			c.Next()
			return
		}

		if user.IsActive {
			c.Set("user", &user)
			c.Set("userID", user.ID)
		}
		
		c.Next()
	}
}

// RoleAuth 角色权限中间件
func RoleAuth(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "未登录",
			})
			c.Abort()
			return
		}

		u := user.(*models.User)
		for _, role := range roles {
			if u.Role == role {
				c.Next()
				return
			}
		}

		logger.Warn("权限不足", 
			zap.Uint("user_id", u.ID),
			zap.String("role", u.Role),
			zap.String("path", c.Request.URL.Path),
		)

		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "权限不足",
		})
		c.Abort()
	}
}
