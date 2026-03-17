package handlers

import (
	"net/http"
	"strconv"
	"time"

	"backend-go/internal/models"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
)

// SystemHandler 系统处理器
type SystemHandler struct{}

// NewSystemHandler 创建系统处理器
func NewSystemHandler() *SystemHandler {
	return &SystemHandler{}
}

// SettingsResponse 设置响应
type SettingsResponse struct {
	SiteName                 string `json:"siteName"`
	SiteLogo                 string `json:"siteLogo"`
	SiteDescription          string `json:"siteDescription"`
	PasswordMinLength        int    `json:"passwordMinLength"`
	LoginAttempts            int    `json:"loginAttempts"`
	Enable2FA                bool   `json:"enable2FA"`
	EnableIPRestriction      bool   `json:"enableIPRestriction"`
	EnableEmailNotifications bool   `json:"enableEmailNotifications"`
	EnableSystemNotifications bool  `json:"enableSystemNotifications"`
	NotificationEmail        string `json:"notificationEmail"`
	BackupFrequency          string `json:"backupFrequency"`
	BackupRetention          int    `json:"backupRetention"`
}

// UpdateSettingsRequest 更新设置请求
type UpdateSettingsRequest struct {
	SiteName                 string `json:"siteName"`
	SiteLogo                 string `json:"siteLogo"`
	SiteDescription          string `json:"siteDescription"`
	PasswordMinLength        int    `json:"passwordMinLength"`
	LoginAttempts            int    `json:"loginAttempts"`
	Enable2FA                bool   `json:"enable2FA"`
	EnableIPRestriction      bool   `json:"enableIPRestriction"`
	EnableEmailNotifications bool   `json:"enableEmailNotifications"`
	EnableSystemNotifications bool  `json:"enableSystemNotifications"`
	NotificationEmail        string `json:"notificationEmail"`
	BackupFrequency          string `json:"backupFrequency"`
	BackupRetention          int    `json:"backupRetention"`
}

// 默认设置键
const (
	SettingSiteName                 = "site_name"
	SettingSiteLogo                 = "site_logo"
	SettingSiteDescription          = "site_description"
	SettingPasswordMinLength        = "password_min_length"
	SettingLoginAttempts            = "login_attempts"
	SettingEnable2FA                = "enable_2fa"
	SettingEnableIPRestriction      = "enable_ip_restriction"
	SettingEnableEmailNotifications = "enable_email_notifications"
	SettingEnableSystemNotifications = "enable_system_notifications"
	SettingNotificationEmail        = "notification_email"
	SettingBackupFrequency          = "backup_frequency"
	SettingBackupRetention          = "backup_retention"
)

// getSetting 获取设置值
func getSetting(key, defaultValue string) string {
	var setting models.SystemSettings
	if err := models.DB.Where("key = ?", key).First(&setting).Error; err != nil {
		return defaultValue
	}
	return setting.Value
}

// setSetting 设置值
func setSetting(key, value string) error {
	var setting models.SystemSettings
	result := models.DB.Where("key = ?", key).First(&setting)
	if result.Error != nil {
		// 不存在则创建
		setting = models.SystemSettings{
			Key:   key,
			Value: value,
		}
		return models.DB.Create(&setting).Error
	}
	// 存在则更新
	setting.Value = value
	return models.DB.Save(&setting).Error
}

// GetSettings 获取系统设置 /system/settings
func (h *SystemHandler) GetSettings(c *gin.Context) {
	settings := SettingsResponse{
		SiteName:                  getSetting(SettingSiteName, "信息管理系统"),
		SiteLogo:                  getSetting(SettingSiteLogo, ""),
		SiteDescription:           getSetting(SettingSiteDescription, "企业级信息管理解决方案"),
		PasswordMinLength:         parseInt(getSetting(SettingPasswordMinLength, "8")),
		LoginAttempts:             parseInt(getSetting(SettingLoginAttempts, "5")),
		Enable2FA:                 getSetting(SettingEnable2FA, "false") == "true",
		EnableIPRestriction:       getSetting(SettingEnableIPRestriction, "false") == "true",
		EnableEmailNotifications:  getSetting(SettingEnableEmailNotifications, "true") == "true",
		EnableSystemNotifications: getSetting(SettingEnableSystemNotifications, "true") == "true",
		NotificationEmail:         getSetting(SettingNotificationEmail, "admin@ims.com"),
		BackupFrequency:           getSetting(SettingBackupFrequency, "weekly"),
		BackupRetention:           parseInt(getSetting(SettingBackupRetention, "30")),
	}

	utils.Success(c, settings, "获取成功")
}

// UpdateSettings 更新系统设置 /system/settings
func (h *SystemHandler) UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error())
		return
	}

	// 更新各项设置
	setSetting(SettingSiteName, req.SiteName)
	setSetting(SettingSiteLogo, req.SiteLogo)
	setSetting(SettingSiteDescription, req.SiteDescription)
	setSetting(SettingPasswordMinLength, intToString(req.PasswordMinLength))
	setSetting(SettingLoginAttempts, intToString(req.LoginAttempts))
	setSetting(SettingEnable2FA, boolToString(req.Enable2FA))
	setSetting(SettingEnableIPRestriction, boolToString(req.EnableIPRestriction))
	setSetting(SettingEnableEmailNotifications, boolToString(req.EnableEmailNotifications))
	setSetting(SettingEnableSystemNotifications, boolToString(req.EnableSystemNotifications))
	setSetting(SettingNotificationEmail, req.NotificationEmail)
	setSetting(SettingBackupFrequency, req.BackupFrequency)
	setSetting(SettingBackupRetention, intToString(req.BackupRetention))

	utils.Success(c, req, "更新成功")
}

// BackupDatabase 备份数据库 /system/backup
func (h *SystemHandler) BackupDatabase(c *gin.Context) {
	// 这里可以实现实际的数据库备份逻辑
	// 目前返回模拟数据

	utils.Success(c, gin.H{
		"success":    true,
		"message":    "数据库备份成功",
		"backupPath": "/backups/backup_" + time.Now().Format("20060102_150405") + ".sql",
		"timestamp":  time.Now().Format(time.RFC3339),
	}, "备份成功")
}

// parseInt 字符串转整数
func parseInt(s string) int {
	i, _ := strconv.Atoi(s)
	return i
}

// intToString 整数转字符串
func intToString(i int) string {
	return strconv.Itoa(i)
}

// boolToString 布尔转字符串
func boolToString(b bool) string {
	return strconv.FormatBool(b)
}
