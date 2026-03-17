package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        int64          `json:"id" gorm:"primaryKey;autoIncrement"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null;size:100"`
	Password  string         `json:"-" gorm:"not null"` // 不在JSON中显示
	FullName  string         `json:"fullName" gorm:"size:100"`
	Avatar    string         `json:"avatar" gorm:"size:255"`
	Phone     string         `json:"phone" gorm:"size:20"`
	Gender    string         `json:"gender" gorm:"size:10"`
	Bio       string         `json:"bio" gorm:"type:text"`
	Skills    string         `json:"skills" gorm:"type:text"`
	Department string        `json:"department" gorm:"size:100"`
	Position  string         `json:"position" gorm:"size:100"`
	Role      string         `json:"role" gorm:"default:'user';size:20"`
	IsActive  bool           `json:"isActive" gorm:"default:true"`
	LastLoginAt *time.Time   `json:"lastLoginAt"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// BeforeCreate 创建前加密密码
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// BeforeUpdate 更新前加密密码
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	// 只有当Password字段被修改时才加密
	if tx.Statement.Changed("Password") && u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// ComparePassword 验证密码
func (u *User) ComparePassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// UpdateLoginInfo 更新登录信息
func (u *User) UpdateLoginInfo() error {
	now := time.Now()
	u.LastLoginAt = &now
	return nil
}

// ToPublicJSON 转换为公开JSON（隐藏敏感信息）
func (u *User) ToPublicJSON() map[string]interface{} {
	return map[string]interface{}{
		"id":         u.ID,
		"username":   u.Username,
		"email":      u.Email,
		"fullName":   u.FullName,
		"avatar":     u.Avatar,
		"phone":      u.Phone,
		"department": u.Department,
		"position":   u.Position,
		"role":       u.Role,
		"isActive":   u.IsActive,
		"createdAt":  u.CreatedAt,
		"updatedAt":  u.UpdatedAt,
		"lastLoginAt": u.LastLoginAt,
	}
}

// ToProfileJSON 转换为个人资料JSON
func (u *User) ToProfileJSON() map[string]interface{} {
	return map[string]interface{}{
		"id":         u.ID,
		"username":   u.Username,
		"email":      u.Email,
		"fullName":   u.FullName,
		"avatar":     u.Avatar,
		"phone":      u.Phone,
		"gender":     u.Gender,
		"bio":        u.Bio,
		"skills":     u.Skills,
		"department": u.Department,
		"position":   u.Position,
		"role":       u.Role,
		"isActive":   u.IsActive,
		"createdAt":  u.CreatedAt,
		"lastLoginAt": u.LastLoginAt,
	}
}

// UserStats 用户统计
type UserStats struct {
	Total       int64       `json:"total"`
	Active      int64       `json:"active"`
	Admins      int64       `json:"admins"`
	RecentUsers []User      `json:"recentUsers"`
}
