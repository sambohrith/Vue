package handlers

import (
	"net/http"

	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	service *services.AuthService
}

// NewAuthHandler 创建认证处理器
func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

// Register 用户注册
func (h *AuthHandler) Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err)
		return
	}

	result, err := h.service.Register(req, c.ClientIP())
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, result, "注册成功")
}

// Login 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err)
		return
	}

	result, err := h.service.Login(req, c.ClientIP())
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, result, "登录成功")
}

// Logout 用户登出
func (h *AuthHandler) Logout(c *gin.Context) {
	userID, _ := c.Get("userID")
	
	err := h.service.Logout(userID.(int64), c.ClientIP())
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, nil, "登出成功")
}

// GetMe 获取当前用户信息
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, _ := c.Get("userID")
	
	user, err := h.service.GetCurrentUser(userID.(int64))
	if err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"user": user}, "获取成功")
}

// GetProfile 获取个人资料
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	
	profile, err := h.service.GetUserProfile(userID.(int64))
	if err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"user": profile}, "获取成功")
}

// ChangePassword 修改密码
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req services.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err)
		return
	}

	userID, _ := c.Get("userID")
	
	err := h.service.ChangePassword(userID.(int64), req, c.ClientIP())
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, nil, "密码修改成功")
}

// RefreshToken 刷新令牌
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req services.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err)
		return
	}

	result, err := h.service.RefreshToken(req)
	if err != nil {
		utils.Error(c, http.StatusUnauthorized, err.Error())
		return
	}

	utils.Success(c, result, "令牌刷新成功")
}
