package services

import (
	"backend-go/internal/models"
	"backend-go/pkg/logger"
	"errors"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// UserService 用户服务
type UserService struct {
	db *gorm.DB
}

// NewUserService 创建用户服务实例
func NewUserService() *UserService {
	return &UserService{db: models.DB}
}

// ListUsersRequest 用户列表请求参数
type ListUsersRequest struct {
	Page     int    `form:"page,default=1"`
	Limit    int    `form:"limit,default=10"`
	Search   string `form:"search"`
	Role     string `form:"role"`
	IsActive string `form:"isActive"`
}

// ListUsersResponse 用户列表响应
type ListUsersResponse struct {
	Users      []models.User `json:"users"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"totalPages"`
}

// ListUsers 获取用户列表
func (s *UserService) ListUsers(req ListUsersRequest) (*ListUsersResponse, error) {
	start := time.Now()
	
	var users []models.User
	var total int64

	query := s.db.Model(&models.User{})

	// 搜索条件
	if req.Search != "" {
		search := "%" + req.Search + "%"
		query = query.Where("username LIKE ? OR email LIKE ? OR full_name LIKE ?", search, search, search)
	}

	// 角色过滤
	if req.Role != "" {
		query = query.Where("role = ?", req.Role)
	}

	// 状态过滤
	if req.IsActive != "" {
		query = query.Where("is_active = ?", req.IsActive == "true")
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		logger.Error("统计用户数量失败", zap.Error(err))
		return nil, err
	}

	// 分页查询
	offset := (req.Page - 1) * req.Limit
	if err := query.
		Select("id, username, email, full_name, avatar, role, is_active, created_at, updated_at, last_login_at").
		Order("created_at DESC").
		Limit(req.Limit).
		Offset(offset).
		Find(&users).Error; err != nil {
		logger.Error("查询用户列表失败", zap.Error(err))
		return nil, err
	}

	duration := time.Since(start)
	logger.Debug("查询用户列表", zap.Duration("duration", duration), zap.Int64("total", total))

	totalPages := int(total) / req.Limit
	if int(total)%req.Limit > 0 {
		totalPages++
	}

	return &ListUsersResponse{
		Users:      users,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetUserByID 根据ID获取用户
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}
	return &user, nil
}

// GetUserByUsername 根据用户名获取用户
func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}
	return &user, nil
}

// CreateUserRequest 创建用户请求
type CreateUserRequest struct {
	Username   string `json:"username" binding:"required,min=3,max=50"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	FullName   string `json:"fullName"`
	Department string `json:"department"`
	Position   string `json:"position"`
	Role       string `json:"role"`
}

// CreateUser 创建用户
func (s *UserService) CreateUser(req CreateUserRequest) (*models.User, error) {
	// 检查用户名
	var count int64
	s.db.Model(&models.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		return nil, errors.New("用户名已存在")
	}

	// 检查邮箱
	s.db.Model(&models.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("邮箱已被注册")
	}

	role := req.Role
	if role == "" {
		role = "user"
	}

	user := models.User{
		Username:   req.Username,
		Email:      req.Email,
		Password:   req.Password,
		FullName:   req.FullName,
		Department: req.Department,
		Position:   req.Position,
		Role:       role,
		IsActive:   true,
	}

	if err := s.db.Create(&user).Error; err != nil {
		logger.Error("创建用户失败", zap.Error(err))
		return nil, err
	}

	logger.Info("创建用户成功", zap.Uint("user_id", user.ID))
	return &user, nil
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
	IsActive *bool  `json:"isActive"`
	FullName string `json:"fullName"`
}

// UpdateUser 更新用户
func (s *UserService) UpdateUser(id uint, req UpdateUserRequest) (*models.User, error) {
	user, err := s.GetUserByID(id)
	if err != nil {
		return nil, err
	}

	// 检查用户名唯一性
	if req.Username != "" && req.Username != user.Username {
		var count int64
		s.db.Model(&models.User{}).Where("username = ?", req.Username).Count(&count)
		if count > 0 {
			return nil, errors.New("用户名已存在")
		}
		user.Username = req.Username
	}

	// 检查邮箱唯一性
	if req.Email != "" && req.Email != user.Email {
		var count int64
		s.db.Model(&models.User{}).Where("email = ?", req.Email).Count(&count)
		if count > 0 {
			return nil, errors.New("邮箱已存在")
		}
		user.Email = req.Email
	}

	if req.Password != "" {
		user.Password = req.Password
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.FullName != "" {
		user.FullName = req.FullName
	}

	if err := s.db.Save(user).Error; err != nil {
		logger.Error("更新用户失败", zap.Error(err), zap.Uint("user_id", id))
		return nil, err
	}

	logger.Info("更新用户成功", zap.Uint("user_id", id))
	return user, nil
}

// DeleteUser 删除用户
func (s *UserService) DeleteUser(id uint) error {
	if err := s.db.Delete(&models.User{}, id).Error; err != nil {
		logger.Error("删除用户失败", zap.Error(err), zap.Uint("user_id", id))
		return err
	}
	logger.Info("删除用户成功", zap.Uint("user_id", id))
	return nil
}

// ToggleUserActive 切换用户状态
func (s *UserService) ToggleUserActive(id uint) (*models.User, error) {
	user, err := s.GetUserByID(id)
	if err != nil {
		return nil, err
	}

	user.IsActive = !user.IsActive
	if err := s.db.Save(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// GetUserStats 获取用户统计
func (s *UserService) GetUserStats() (*models.UserStats, error) {
	var total, active, admins int64

	if err := s.db.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&models.User{}).Where("is_active = ?", true).Count(&active).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&models.User{}).Where("role = ?", "admin").Count(&admins).Error; err != nil {
		return nil, err
	}

	var recentUsers []models.User
	if err := s.db.
		Select("id, username, email, created_at").
		Where("is_active = ?", true).
		Order("created_at DESC").
		Limit(5).
		Find(&recentUsers).Error; err != nil {
		return nil, err
	}

	return &models.UserStats{
		Total:       total,
		Active:      active,
		Admins:      admins,
		RecentUsers: recentUsers,
	}, nil
}

// GetAllContacts 获取所有联系人
func (s *UserService) GetAllContacts() ([]models.User, error) {
	var users []models.User
	if err := s.db.
		Select("id, username, full_name, avatar, department, position, last_login_at").
		Where("is_active = ?", true).
		Order("username ASC").
		Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// UpdateProfileRequest 更新个人资料请求
type UpdateProfileRequest struct {
	FullName   string `json:"fullName"`
	Phone      string `json:"phone"`
	Department string `json:"department"`
	Position   string `json:"position"`
	Gender     string `json:"gender"`
	Bio        string `json:"bio"`
	Skills     string `json:"skills"`
}

// UpdateProfile 更新个人资料
func (s *UserService) UpdateProfile(userID uint, req UpdateProfileRequest) (*models.User, error) {
	user, err := s.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Department != "" {
		user.Department = req.Department
	}
	if req.Position != "" {
		user.Position = req.Position
	}
	if req.Gender != "" {
		user.Gender = req.Gender
	}
	if req.Bio != "" {
		user.Bio = req.Bio
	}
	if req.Skills != "" {
		user.Skills = req.Skills
	}

	if err := s.db.Save(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}
