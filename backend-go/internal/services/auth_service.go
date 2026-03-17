package services

import (
	"backend-go/config"
	"backend-go/internal/middleware"
	"backend-go/internal/models"
	"backend-go/pkg/logger"
	"errors"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// AuthService 认证服务
type AuthService struct {
	db     *gorm.DB
	config *config.Config
}

// NewAuthService 创建认证服务实例
func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{
		db:     models.DB,
		config: cfg,
	}
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"fullName"`
}

// RegisterResponse 注册响应
type RegisterResponse struct {
	User  map[string]interface{} `json:"user"`
	Token string                 `json:"token"`
}

// Register 用户注册
func (s *AuthService) Register(req RegisterRequest, clientIP string) (*RegisterResponse, error) {
	// 检查用户名和邮箱
	var count int64
	s.db.Model(&models.User{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("用户名或邮箱已被使用")
	}

	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
		FullName: req.FullName,
		Role:     "user",
		IsActive: true,
	}

	if user.FullName == "" {
		user.FullName = req.Username
	}

	if err := s.db.Create(&user).Error; err != nil {
		logger.Error("创建用户失败", zap.Error(err))
		return nil, errors.New("注册失败")
	}

	// 生成JWT令牌
	token, err := middleware.GenerateToken(user.ID)
	if err != nil {
		logger.Error("生成令牌失败", zap.Error(err))
		return nil, errors.New("注册失败")
	}

	logger.Auth("register", user.ID, true, zap.String("ip", clientIP))

	return &RegisterResponse{
		User:  user.ToPublicJSON(),
		Token: token,
	}, nil
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	User  map[string]interface{} `json:"user"`
	Token string                 `json:"token"`
}

// Login 用户登录
func (s *AuthService) Login(req LoginRequest, clientIP string) (*LoginResponse, error) {
	var user models.User
	if err := s.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Auth("login", 0, false, zap.String("ip", clientIP), zap.String("username", req.Username), zap.String("reason", "用户不存在"))
			return nil, errors.New("账号或密码错误")
		}
		return nil, errors.New("登录失败")
	}

	if !user.IsActive {
		logger.Auth("login", user.ID, false, zap.String("ip", clientIP), zap.String("username", req.Username), zap.String("reason", "账户已被禁用"))
		return nil, errors.New("账户已被禁用，请联系管理员")
	}

	if !user.ComparePassword(req.Password) {
		// 临时兼容：尝试明文密码比较（云端数据库遗留数据）
		if user.Password != req.Password {
			logger.Auth("login", user.ID, false, zap.String("ip", clientIP), zap.String("username", req.Username), zap.String("reason", "密码错误"))
			return nil, errors.New("账号或密码错误")
		}
		// 明文密码匹配，更新为加密密码
		user.Password = req.Password
		s.db.Save(&user)
	}

	// 更新登录信息
	user.UpdateLoginInfo()
	s.db.Save(&user)

	// 生成JWT令牌
	token, err := middleware.GenerateToken(user.ID)
	if err != nil {
		logger.Error("生成令牌失败", zap.Error(err))
		return nil, errors.New("登录失败")
	}

	logger.Auth("login", user.ID, true, zap.String("ip", clientIP), zap.String("username", req.Username))

	return &LoginResponse{
		User:  user.ToPublicJSON(),
		Token: token,
	}, nil
}

// Logout 用户登出
func (s *AuthService) Logout(userID int64, clientIP string) error {
	logger.Auth("logout", userID, true, zap.String("ip", clientIP))
	return nil
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}

// ChangePassword 修改密码
func (s *AuthService) ChangePassword(userID int64, req ChangePasswordRequest, clientIP string) error {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return errors.New("用户不存在")
	}

	if !user.ComparePassword(req.CurrentPassword) {
		return errors.New("当前密码不正确")
	}

	user.Password = req.NewPassword
	if err := s.db.Save(&user).Error; err != nil {
		logger.Error("修改密码失败", zap.Error(err), zap.Int64("user_id", userID))
		return errors.New("修改密码失败")
	}

	logger.Auth("changePassword", userID, true, zap.String("ip", clientIP))
	return nil
}

// GetCurrentUser 获取当前用户信息
func (s *AuthService) GetCurrentUser(userID int64) (map[string]interface{}, error) {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}
	return user.ToPublicJSON(), nil
}

// GetUserProfile 获取用户个人资料
func (s *AuthService) GetUserProfile(userID int64) (map[string]interface{}, error) {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}
	return user.ToProfileJSON(), nil
}

// RefreshTokenRequest 刷新令牌请求
type RefreshTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

// RefreshToken 刷新令牌
func (s *AuthService) RefreshToken(req RefreshTokenRequest) (*LoginResponse, error) {
	token, claims, err := middleware.ParseToken(req.Token)
	if err != nil || !token.Valid {
		logger.Auth("refreshToken", 0, false, zap.String("reason", "无效令牌"))
		return nil, errors.New("令牌无效或已过期")
	}

	userID, ok := claims["user_id"].(float64)
	if !ok {
		return nil, errors.New("无效的令牌")
	}

	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}

	if !user.IsActive {
		return nil, errors.New("账户已被禁用")
	}

	newToken, err := middleware.GenerateToken(user.ID)
	if err != nil {
		logger.Error("生成新令牌失败", zap.Error(err))
		return nil, errors.New("刷新令牌失败")
	}

	return &LoginResponse{
		User:  user.ToPublicJSON(),
		Token: newToken,
	}, nil
}
