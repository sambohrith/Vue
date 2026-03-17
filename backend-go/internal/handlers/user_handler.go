package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/models"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
)

// UserHandler 用户处理器
type UserHandler struct {
	service *services.UserService
}

// NewUserHandler 创建用户处理器
func NewUserHandler() *UserHandler {
	return &UserHandler{service: services.NewUserService()}
}

// ListUsers 获取用户列表
func (h *UserHandler) ListUsers(c *gin.Context) {
	var req services.ListUsersRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		req.Page = 1
		req.Limit = 10
	}

	if req.Limit <= 0 || req.Limit > 100 {
		req.Limit = 10
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	result, err := h.service.ListUsers(req)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取用户列表失败")
		return
	}

	// 返回格式适配前端期望 - 使用标准 data 包装
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "获取成功",
		"data": gin.H{
			"users": result.Users,
			"pagination": gin.H{
				"page":       result.Page,
				"limit":      result.Limit,
				"total":      result.Total,
				"totalPages": result.TotalPages,
			},
		},
	})
}

// GetUser 获取单个用户
func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的用户ID")
		return
	}

	user, err := h.service.GetUserByID(int64(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"user": user.ToPublicJSON()}, "获取成功")
}

// CreateUser 创建用户
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req services.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err)
		return
	}

	user, err := h.service.CreateUser(req)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, gin.H{"user": user.ToPublicJSON()}, "用户创建成功")
}

// UpdateUser 更新用户
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的用户ID")
		return
	}

	var req services.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err)
		return
	}

	user, err := h.service.UpdateUser(int64(id), req)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, gin.H{"user": user.ToPublicJSON()}, "用户更新成功")
}

// DeleteUser 删除用户
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的用户ID")
		return
	}

	// 不能删除自己
	currentUserID, _ := c.Get("userID")
	if int64(id) == currentUserID.(int64) {
		utils.Error(c, http.StatusBadRequest, "不能删除自己的账号")
		return
	}

	if err := h.service.DeleteUser(int64(id)); err != nil {
		utils.Error(c, http.StatusInternalServerError, "删除用户失败")
		return
	}

	utils.Success(c, nil, "用户已删除")
}

// ToggleUserActive 切换用户状态
func (h *UserHandler) ToggleUserActive(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的用户ID")
		return
	}

	// 不能禁用自己
	currentUserID, _ := c.Get("userID")
	if int64(id) == currentUserID.(int64) {
		utils.Error(c, http.StatusBadRequest, "不能禁用自己的账号")
		return
	}

	user, err := h.service.ToggleUserActive(int64(id))
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	message := "用户已禁用"
	if user.IsActive {
		message = "用户已启用"
	}

	utils.Success(c, gin.H{"user": user.ToPublicJSON()}, message)
}

// GetUserStats 获取用户统计
func (h *UserHandler) GetUserStats(c *gin.Context) {
	stats, err := h.service.GetUserStats()
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取统计失败")
		return
	}

	utils.Success(c, stats, "获取成功")
}

// GetMyInfo 获取我的信息
func (h *UserHandler) GetMyInfo(c *gin.Context) {
	userID, _ := c.Get("userID")
	
	user, err := h.service.GetUserByID(userID.(int64))
	if err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"user": user.ToProfileJSON()}, "获取成功")
}

// UpdateMyInfo 更新我的信息
func (h *UserHandler) UpdateMyInfo(c *gin.Context) {
	var req services.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err)
		return
	}

	userID, _ := c.Get("userID")
	
	user, err := h.service.UpdateProfile(userID.(int64), req)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, gin.H{"user": user.ToProfileJSON()}, "信息更新成功")
}

// GetDashboardStats 获取仪表盘统计
func (h *UserHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.service.GetUserStats()
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取统计失败")
		return
	}

	// 获取系统信息
	systemInfo := map[string]interface{}{
		"nodeVersion":   "Go 1.21",
		"platform":      "unknown",
		"uptime":        0,
		"memoryUsage":   map[string]string{},
		"serverTime":    utils.FormatTime(nil),
	}

	utils.Success(c, gin.H{
		"totalUsers":  stats.Total,
		"onlineUsers": stats.Active,
		"adminUsers":  stats.Admins,
		"activeUsers": stats.Active,
		"totalPosts":  0,
		"totalRooms":  0,
		"totalMessages": 0,
		"system":      systemInfo,
	}, "获取成功")
}

// GetAllContacts 获取所有联系人
func (h *UserHandler) GetAllContacts(c *gin.Context) {
	users, err := h.service.GetAllContacts()
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取联系人失败")
		return
	}

	utils.Success(c, gin.H{"users": users}, "获取成功")
}

// GetCurrentUser 从上下文获取当前用户
func GetCurrentUser(c *gin.Context) *models.User {
	user, exists := c.Get("user")
	if !exists {
		return nil
	}
	return user.(*models.User)
}
