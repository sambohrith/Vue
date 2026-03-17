package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/models"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
)

// ChatHandler 聊天处理器
type ChatHandler struct{}

// NewChatHandler 创建聊天处理器
func NewChatHandler() *ChatHandler {
	return &ChatHandler{}
}

// ChatContactResponse 聊天联系人响应
type ChatContactResponse struct {
	ID              int64  `json:"id"`
	UserID          int64  `json:"userId"`
	Name            string `json:"name"`
	Email           string `json:"email"`
	Avatar          string `json:"avatar"`
	LastMessage     string `json:"lastMessage"`
	LastMessageTime string `json:"lastMessageTime"`
	UnreadCount     int64  `json:"unreadCount"`
}

// ChatMessageResponse 聊天消息响应
type ChatMessageResponse struct {
	ID           int64  `json:"id"`
	Content      string `json:"content"`
	SenderID     int64  `json:"senderId"`
	SenderName   string `json:"senderName"`
	ReceiverID   int64  `json:"receiverId"`
	ReceiverName string `json:"receiverName"`
	IsRead       bool   `json:"isRead"`
	CreatedAt    string `json:"createdAt"`
}

// SendMessageRequest 发送消息请求
type SendMessageRequest struct {
	ReceiverID int64  `json:"receiverId" binding:"required"`
	Content    string `json:"content" binding:"required"`
}

// GetChatList 获取聊天联系人列表 /chat/list
func (h *ChatHandler) GetChatList(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	// 获取所有其他用户作为联系人
	var users []models.User
	if err := models.DB.Where("id != ? AND is_active = ?", currentUserID, true).Find(&users).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取联系人失败")
		return
	}

	// 构建联系人列表，包含最后一条消息和未读数
	contacts := make([]ChatContactResponse, 0, len(users))
	for _, user := range users {
		contact := ChatContactResponse{
			ID:      user.ID,
			UserID:  user.ID,
			Name:    user.FullName,
			Email:   user.Email,
			Avatar:  user.Avatar,
		}

		// 如果没有 fullName，使用用户名
		if contact.Name == "" {
			contact.Name = user.Username
		}

		// 获取最后一条消息
		var lastMsg models.ChatMessage
		if err := models.DB.Where(
			"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			currentUserID, user.ID, user.ID, currentUserID,
		).Order("created_at DESC").First(&lastMsg).Error; err == nil {
			contact.LastMessage = lastMsg.Content
			contact.LastMessageTime = lastMsg.CreatedAt.Format("2006-01-02 15:04:05")
		}

		// 获取未读消息数（该用户发送给当前用户的未读消息）
		var unreadCount int64
		models.DB.Model(&models.ChatMessage{}).Where(
			"sender_id = ? AND receiver_id = ? AND is_read = ?",
			user.ID, currentUserID, false,
		).Count(&unreadCount)
		contact.UnreadCount = unreadCount

		contacts = append(contacts, contact)
	}

	utils.Success(c, gin.H{
		"contacts": contacts,
		"total":    len(contacts),
	}, "获取成功")
}

// GetChatHistory 获取聊天历史 /chat/history/:userId
func (h *ChatHandler) GetChatHistory(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	// 获取对方用户ID
	otherUserID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的用户ID")
		return
	}

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	// 查询消息总数
	var total int64
	models.DB.Model(&models.ChatMessage{}).Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		currentUserID, otherUserID, otherUserID, currentUserID,
	).Count(&total)

	// 查询消息
	var messages []models.ChatMessage
	if err := models.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		currentUserID, otherUserID, otherUserID, currentUserID,
	).Order("created_at DESC").Limit(limit).Offset(offset).Find(&messages).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取消息失败")
		return
	}

	// 转换为响应格式
	response := make([]ChatMessageResponse, 0, len(messages))
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		senderName := ""
		receiverName := ""

		// 获取发送者名称
		var sender models.User
		if err := models.DB.Select("full_name, username").First(&sender, msg.SenderID).Error; err == nil {
			senderName = sender.FullName
			if senderName == "" {
				senderName = sender.Username
			}
		}

		// 获取接收者名称
		var receiver models.User
		if err := models.DB.Select("full_name, username").First(&receiver, msg.ReceiverID).Error; err == nil {
			receiverName = receiver.FullName
			if receiverName == "" {
				receiverName = receiver.Username
			}
		}

		response = append(response, ChatMessageResponse{
			ID:           msg.ID,
			Content:      msg.Content,
			SenderID:     msg.SenderID,
			SenderName:   senderName,
			ReceiverID:   msg.ReceiverID,
			ReceiverName: receiverName,
			IsRead:       msg.IsRead,
			CreatedAt:    msg.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	utils.Success(c, gin.H{
		"messages": response,
		"total":    total,
		"page":     page,
		"limit":    limit,
	}, "获取成功")
}

// SendMessage 发送消息 /chat/send
func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error())
		return
	}

	// 不能给自己发送消息
	if req.ReceiverID == currentUserID {
		utils.Error(c, http.StatusBadRequest, "不能给自己发送消息")
		return
	}

	// 检查接收者是否存在
	var receiver models.User
	if err := models.DB.First(&receiver, req.ReceiverID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "接收者不存在")
		return
	}

	// 创建消息
	message := models.ChatMessage{
		SenderID:   currentUserID,
		ReceiverID: req.ReceiverID,
		Content:    req.Content,
		IsRead:     false,
	}

	if err := models.DB.Create(&message).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "发送消息失败")
		return
	}

	// 获取发送者名称
	var sender models.User
	senderName := ""
	if err := models.DB.Select("full_name, username").First(&sender, currentUserID).Error; err == nil {
		senderName = sender.FullName
		if senderName == "" {
			senderName = sender.Username
		}
	}

	receiverName := receiver.FullName
	if receiverName == "" {
		receiverName = receiver.Username
	}

	utils.Success(c, ChatMessageResponse{
		ID:           message.ID,
		Content:      message.Content,
		SenderID:     message.SenderID,
		SenderName:   senderName,
		ReceiverID:   message.ReceiverID,
		ReceiverName: receiverName,
		IsRead:       message.IsRead,
		CreatedAt:    message.CreatedAt.Format("2006-01-02 15:04:05"),
	}, "发送成功")
}

// MarkAsRead 标记消息为已读 /chat/read/:userId
func (h *ChatHandler) MarkAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	// 获取对方用户ID（将来自该用户的消息标记为已读）
	otherUserID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的用户ID")
		return
	}

	// 将所有来自该用户的消息标记为已读
	result := models.DB.Model(&models.ChatMessage{}).Where(
		"sender_id = ? AND receiver_id = ? AND is_read = ?",
		otherUserID, currentUserID, false,
	).Update("is_read", true)

	if result.Error != nil {
		utils.Error(c, http.StatusInternalServerError, "标记已读失败")
		return
	}

	utils.Success(c, gin.H{
		"markedCount": result.RowsAffected,
	}, "标记成功")
}

// GetUnreadCount 获取未读消息总数 /chat/unread
func (h *ChatHandler) GetUnreadCount(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	var count int64
	if err := models.DB.Model(&models.ChatMessage{}).Where(
		"receiver_id = ? AND is_read = ?",
		currentUserID, false,
	).Count(&count).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取未读数失败")
		return
	}

	utils.Success(c, gin.H{
		"unreadCount": count,
	}, "获取成功")
}

// GetAllMessages 管理员获取所有消息 /chat/admin/messages
func (h *ChatHandler) GetAllMessages(c *gin.Context) {
	// 检查是否是管理员
	role, exists := c.Get("userRole")
	if !exists || role.(string) != "admin" {
		utils.Error(c, http.StatusForbidden, "无权限访问")
		return
	}

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	search := c.Query("search")
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	// 构建查询
	query := models.DB.Model(&models.ChatMessage{})
	if search != "" {
		query = query.Where("content LIKE ?", "%"+search+"%")
	}

	// 查询总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取消息失败")
		return
	}

	// 查询消息
	var messages []models.ChatMessage
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&messages).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取消息失败")
		return
	}

	// 转换为响应格式
	response := make([]ChatMessageResponse, len(messages))
	for i, msg := range messages {
		senderName := ""
		receiverName := ""

		var sender models.User
		if err := models.DB.Select("full_name, username").First(&sender, msg.SenderID).Error; err == nil {
			senderName = sender.FullName
			if senderName == "" {
				senderName = sender.Username
			}
		}

		var receiver models.User
		if err := models.DB.Select("full_name, username").First(&receiver, msg.ReceiverID).Error; err == nil {
			receiverName = receiver.FullName
			if receiverName == "" {
				receiverName = receiver.Username
			}
		}

		response[i] = ChatMessageResponse{
			ID:           msg.ID,
			Content:      msg.Content,
			SenderID:     msg.SenderID,
			SenderName:   senderName,
			ReceiverID:   msg.ReceiverID,
			ReceiverName: receiverName,
			IsRead:       msg.IsRead,
			CreatedAt:    msg.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	utils.Success(c, gin.H{
		"messages": response,
		"total":    total,
	}, "获取成功")
}

// GetAllConversations 管理员获取所有对话 /chat/admin/conversations
func (h *ChatHandler) GetAllConversations(c *gin.Context) {
	// 检查是否是管理员
	role, exists := c.Get("userRole")
	if !exists || role.(string) != "admin" {
		utils.Error(c, http.StatusForbidden, "无权限访问")
		return
	}

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	search := c.Query("search")
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	// 获取所有活跃用户
	query := models.DB.Model(&models.User{}).Where("is_active = ?", true)
	if search != "" {
		query = query.Where("username LIKE ? OR full_name LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取对话失败")
		return
	}

	var users []models.User
	if err := query.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取对话失败")
		return
	}

	// 构建对话列表
	conversations := make([]ChatContactResponse, 0, len(users))
	for _, user := range users {
		name := user.FullName
		if name == "" {
			name = user.Username
		}

		// 获取该用户最后一条消息
		var lastMsg models.ChatMessage
		var lastMessage string
		var lastMessageTime string
		if err := models.DB.Where("sender_id = ? OR receiver_id = ?", user.ID, user.ID).Order("created_at DESC").First(&lastMsg).Error; err == nil {
			lastMessage = lastMsg.Content
			lastMessageTime = lastMsg.CreatedAt.Format("2006-01-02 15:04:05")
		}

		// 获取该用户相关未读消息数
		var unreadCount int64
		models.DB.Model(&models.ChatMessage{}).Where("receiver_id = ? AND is_read = ?", user.ID, false).Count(&unreadCount)

		conversations = append(conversations, ChatContactResponse{
			ID:              user.ID,
			UserID:          user.ID,
			Name:            name,
			Email:           user.Email,
			Avatar:          user.Avatar,
			LastMessage:     lastMessage,
			LastMessageTime: lastMessageTime,
			UnreadCount:     unreadCount,
		})
	}

	utils.Success(c, gin.H{
		"conversations": conversations,
		"total":         total,
	}, "获取成功")
}
