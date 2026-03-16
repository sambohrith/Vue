package utils

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// Pagination 分页信息
type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

// Response 统一响应结构
type Response struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp string      `json:"timestamp"`
	RequestID string      `json:"requestId,omitempty"`
}

// PaginatedResponse 分页响应结构
type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data,omitempty"`
	Pagination Pagination  `json:"pagination"`
	Timestamp  string      `json:"timestamp"`
	RequestID  string      `json:"requestId,omitempty"`
}

// ErrorResponse 错误响应结构
type ErrorResponse struct {
	Success   bool              `json:"success"`
	Message   string            `json:"message"`
	Errors    map[string]string `json:"errors,omitempty"`
	Timestamp string            `json:"timestamp"`
	RequestID string            `json:"requestId,omitempty"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}, message string) {
	response := Response{
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: FormatTime(nil),
	}
	if rid, exists := c.Get("requestID"); exists {
		response.RequestID = rid.(string)
	}
	c.JSON(http.StatusOK, response)
}

// Created 创建成功响应
func Created(c *gin.Context, data interface{}, message string) {
	response := Response{
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: FormatTime(nil),
	}
	if rid, exists := c.Get("requestID"); exists {
		response.RequestID = rid.(string)
	}
	c.JSON(http.StatusCreated, response)
}

// Paginated 分页响应
func Paginated(c *gin.Context, data interface{}, pagination Pagination, message string) {
	response := PaginatedResponse{
		Success:    true,
		Message:    message,
		Data:       data,
		Pagination: pagination,
		Timestamp:  FormatTime(nil),
	}
	if rid, exists := c.Get("requestID"); exists {
		response.RequestID = rid.(string)
	}
	c.JSON(http.StatusOK, response)
}

// Error 错误响应
func Error(c *gin.Context, statusCode int, message string) {
	response := Response{
		Success:   false,
		Message:   message,
		Timestamp: FormatTime(nil),
	}
	if rid, exists := c.Get("requestID"); exists {
		response.RequestID = rid.(string)
	}
	c.JSON(statusCode, response)
}

// ValidationError 验证错误响应
func ValidationError(c *gin.Context, err error) {
	errors := make(map[string]string)
	
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			errors[e.Field()] = e.Translate(nil)
		}
	} else {
		errors["general"] = err.Error()
	}

	response := ErrorResponse{
		Success:   false,
		Message:   "数据验证失败",
		Errors:    errors,
		Timestamp: FormatTime(nil),
	}
	if rid, exists := c.Get("requestID"); exists {
		response.RequestID = rid.(string)
	}
	c.JSON(http.StatusBadRequest, response)
}

// BadRequest 400错误
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

// Unauthorized 401错误
func Unauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "未授权访问"
	}
	Error(c, http.StatusUnauthorized, message)
}

// Forbidden 403错误
func Forbidden(c *gin.Context, message string) {
	if message == "" {
		message = "禁止访问"
	}
	Error(c, http.StatusForbidden, message)
}

// NotFound 404错误
func NotFound(c *gin.Context, message string) {
	if message == "" {
		message = "资源不存在"
	}
	Error(c, http.StatusNotFound, message)
}

// Conflict 409错误
func Conflict(c *gin.Context, message string) {
	if message == "" {
		message = "资源冲突"
	}
	Error(c, http.StatusConflict, message)
}

// TooManyRequests 429错误
func TooManyRequests(c *gin.Context, message string) {
	if message == "" {
		message = "请求过于频繁，请稍后再试"
	}
	Error(c, http.StatusTooManyRequests, message)
}

// FormatTime 格式化时间
func FormatTime(t *time.Time) string {
	if t == nil {
		return time.Now().Format(time.RFC3339)
	}
	return t.Format(time.RFC3339)
}
