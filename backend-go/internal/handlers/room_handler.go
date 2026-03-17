package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/models"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
)

// RoomHandler 房间处理器
type RoomHandler struct{}

// NewRoomHandler 创建房间处理器
func NewRoomHandler() *RoomHandler {
	return &RoomHandler{}
}

// RoomResponse 房间响应
type RoomResponse struct {
	ID            int64  `json:"id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	IsPublic      bool   `json:"isPublic"`
	OwnerID       int64  `json:"ownerId"`
	OwnerName     string `json:"ownerName"`
	MemberCount   int    `json:"memberCount"`
	InviteCode    string `json:"inviteCode,omitempty"`
	CreatedAt     string `json:"createdAt"`
	MessageCount  int    `json:"messageCount,omitempty"`
}

// RoomMemberResponse 房间成员响应
type RoomMemberResponse struct {
	ID       int64  `json:"id"`
	RoomID   int64  `json:"roomId"`
	UserID   int64  `json:"userId"`
	UserName string `json:"userName"`
	UserAvatar string `json:"userAvatar"`
	Role     string `json:"role"`
	JoinedAt string `json:"joinedAt"`
}

// RoomMessageResponse 房间消息响应
type RoomMessageResponse struct {
	ID         int64  `json:"id"`
	Content    string `json:"content"`
	UserID     int64  `json:"userId"`
	UserName   string `json:"userName"`
	UserAvatar string `json:"userAvatar"`
	RoomID     int64  `json:"roomId"`
	CreatedAt  string `json:"createdAt"`
}

// CreateRoomRequest 创建房间请求
type CreateRoomRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	IsPublic    bool   `json:"isPublic"`
}

// generateInviteCode 生成邀请码
func generateInviteCode() string {
	// 生成6位随机邀请码
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	code := make([]byte, 6)
	for i := range code {
		code[i] = chars[randInt(len(chars))]
	}
	return string(code)
}

func randInt(n int) int {
	// 简单的随机数生成
	return int(uint32(n) * 1103515245 >> 16) % n
}

// GetPublicRooms 获取公开房间列表 /social/rooms/public
func (h *RoomHandler) GetPublicRooms(c *gin.Context) {
	// 查询公开房间
	var rooms []models.Room
	if err := models.DB.Where("is_active = ?", true).Order("created_at DESC").Find(&rooms).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取房间失败")
		return
	}

	// 转换为响应格式
	response := make([]RoomResponse, 0, len(rooms))
	for _, room := range rooms {
		// 获取房主信息
		var owner models.User
		ownerName := ""
		if err := models.DB.Select("full_name, username").First(&owner, room.OwnerID).Error; err == nil {
			ownerName = owner.FullName
			if ownerName == "" {
				ownerName = owner.Username
			}
		}

		// 获取成员数
		var memberCount int64
		models.DB.Model(&models.RoomMember{}).Where("room_id = ?", room.ID).Count(&memberCount)

		// 获取消息数
		var messageCount int64
		models.DB.Model(&models.RoomMessage{}).Where("room_id = ?", room.ID).Count(&messageCount)

		response = append(response, RoomResponse{
			ID:           room.ID,
			Name:         room.Name,
			Description:  room.Description,
			IsPublic:     room.IsActive,
			OwnerID:      room.OwnerID,
			OwnerName:    ownerName,
			MemberCount:  int(memberCount),
			CreatedAt:    room.CreatedAt.Format("2006-01-02 15:04:05"),
			MessageCount: int(messageCount),
		})
	}

	utils.Success(c, gin.H{
		"rooms": response,
		"total": len(response),
	}, "获取成功")
}

// GetMyRooms 获取我的房间列表 /social/rooms/my
func (h *RoomHandler) GetMyRooms(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	// 查询我加入的房间
	var members []models.RoomMember
	if err := models.DB.Where("user_id = ?", currentUserID).Find(&members).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取房间失败")
		return
	}

	// 获取房间详情
	roomIDs := make([]int64, 0, len(members))
	for _, m := range members {
		roomIDs = append(roomIDs, m.RoomID)
	}

	var rooms []models.Room
	if len(roomIDs) > 0 {
		models.DB.Where("id IN ? AND is_active = ?", roomIDs, true).Find(&rooms)
	}

	// 转换为响应格式
	response := make([]RoomResponse, 0, len(rooms))
	for _, room := range rooms {
		// 获取房主信息
		var owner models.User
		ownerName := ""
		if err := models.DB.Select("full_name, username").First(&owner, room.OwnerID).Error; err == nil {
			ownerName = owner.FullName
			if ownerName == "" {
				ownerName = owner.Username
			}
		}

		// 获取成员数
		var memberCount int64
		models.DB.Model(&models.RoomMember{}).Where("room_id = ?", room.ID).Count(&memberCount)

		// 获取消息数
		var messageCount int64
		models.DB.Model(&models.RoomMessage{}).Where("room_id = ?", room.ID).Count(&messageCount)

		response = append(response, RoomResponse{
			ID:           room.ID,
			Name:         room.Name,
			Description:  room.Description,
			IsPublic:     room.IsActive,
			OwnerID:      room.OwnerID,
			OwnerName:    ownerName,
			MemberCount:  int(memberCount),
			CreatedAt:    room.CreatedAt.Format("2006-01-02 15:04:05"),
			MessageCount: int(messageCount),
		})
	}

	utils.Success(c, gin.H{
		"rooms": response,
		"total": len(response),
	}, "获取成功")
}

// GetRoom 获取房间详情 /social/rooms/:id
func (h *RoomHandler) GetRoom(c *gin.Context) {
	roomID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的房间ID")
		return
	}

	var room models.Room
	if err := models.DB.First(&room, roomID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "房间不存在")
		return
	}

	// 获取房主信息
	var owner models.User
	ownerName := ""
	if err := models.DB.Select("full_name, username").First(&owner, room.OwnerID).Error; err == nil {
		ownerName = owner.FullName
		if ownerName == "" {
			ownerName = owner.Username
		}
	}

	// 获取成员数
	var memberCount int64
	models.DB.Model(&models.RoomMember{}).Where("room_id = ?", roomID).Count(&memberCount)

	utils.Success(c, RoomResponse{
		ID:          room.ID,
		Name:        room.Name,
		Description: room.Description,
		IsPublic:    room.IsActive,
		OwnerID:     room.OwnerID,
		OwnerName:   ownerName,
		MemberCount: int(memberCount),
		CreatedAt:   room.CreatedAt.Format("2006-01-02 15:04:05"),
	}, "获取成功")
}

// CreateRoom 创建房间 /social/rooms
func (h *RoomHandler) CreateRoom(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error())
		return
	}

	// 创建房间
	room := models.Room{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     currentUserID,
		IsActive:    req.IsPublic,
	}

	if err := models.DB.Create(&room).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "创建房间失败")
		return
	}

	// 创建者自动成为房间成员（房主）
	member := models.RoomMember{
		RoomID: room.ID,
		UserID: currentUserID,
		Role:   "owner",
	}
	models.DB.Create(&member)

	// 获取作者信息
	var owner models.User
	ownerName := ""
	if err := models.DB.Select("full_name, username").First(&owner, currentUserID).Error; err == nil {
		ownerName = owner.FullName
		if ownerName == "" {
			ownerName = owner.Username
		}
	}

	utils.Success(c, RoomResponse{
		ID:          room.ID,
		Name:        room.Name,
		Description: room.Description,
		IsPublic:    req.IsPublic,
		OwnerID:     currentUserID,
		OwnerName:   ownerName,
		MemberCount: 1,
		CreatedAt:   room.CreatedAt.Format("2006-01-02 15:04:05"),
	}, "创建成功")
}

// JoinRoom 加入房间 /social/rooms/:id/join
func (h *RoomHandler) JoinRoom(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	roomID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的房间ID")
		return
	}

	// 检查房间是否存在
	var room models.Room
	if err := models.DB.First(&room, roomID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "房间不存在")
		return
	}

	// 检查是否已经是成员
	var existingMember models.RoomMember
	if err := models.DB.Where("room_id = ? AND user_id = ?", roomID, currentUserID).First(&existingMember).Error; err == nil {
		utils.Error(c, http.StatusBadRequest, "您已经是该房间的成员")
		return
	}

	// 添加成员
	member := models.RoomMember{
		RoomID: roomID,
		UserID: currentUserID,
		Role:   "member",
	}
	if err := models.DB.Create(&member).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "加入房间失败")
		return
	}

	utils.Success(c, nil, "加入成功")
}

// LeaveRoom 离开房间 /social/rooms/:id/leave
func (h *RoomHandler) LeaveRoom(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	roomID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的房间ID")
		return
	}

	// 删除成员记录
	result := models.DB.Where("room_id = ? AND user_id = ?", roomID, currentUserID).Delete(&models.RoomMember{})
	if result.RowsAffected == 0 {
		utils.Error(c, http.StatusBadRequest, "您不是该房间的成员")
		return
	}

	utils.Success(c, nil, "离开成功")
}

// GetRoomMembers 获取房间成员 /social/rooms/:id/members
func (h *RoomHandler) GetRoomMembers(c *gin.Context) {
	roomID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的房间ID")
		return
	}

	// 检查房间是否存在
	var room models.Room
	if err := models.DB.First(&room, roomID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "房间不存在")
		return
	}

	// 查询成员
	var members []models.RoomMember
	if err := models.DB.Where("room_id = ?", roomID).Find(&members).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取成员失败")
		return
	}

	// 转换为响应格式
	response := make([]RoomMemberResponse, 0, len(members))
	for _, member := range members {
		// 获取用户信息
		var user models.User
		userName := ""
		userAvatar := ""
		if err := models.DB.Select("full_name, username, avatar").First(&user, member.UserID).Error; err == nil {
			userName = user.FullName
			if userName == "" {
				userName = user.Username
			}
			userAvatar = user.Avatar
		}

		response = append(response, RoomMemberResponse{
			ID:         member.ID,
			RoomID:     member.RoomID,
			UserID:     member.UserID,
			UserName:   userName,
			UserAvatar: userAvatar,
			Role:       member.Role,
			JoinedAt:   member.JoinedAt.Format("2006-01-02 15:04:05"),
		})
	}

	utils.Success(c, gin.H{
		"members": response,
		"total":   len(response),
	}, "获取成功")
}

// GetRoomMessages 获取房间消息 /social/rooms/:id/messages
func (h *RoomHandler) GetRoomMessages(c *gin.Context) {
	roomID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的房间ID")
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

	// 检查房间是否存在
	var room models.Room
	if err := models.DB.First(&room, roomID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "房间不存在")
		return
	}

	// 查询消息总数
	var total int64
	models.DB.Model(&models.RoomMessage{}).Where("room_id = ?", roomID).Count(&total)

	// 查询消息
	var messages []models.RoomMessage
	if err := models.DB.Where("room_id = ?", roomID).Order("created_at DESC").Limit(limit).Offset(offset).Find(&messages).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取消息失败")
		return
	}

	// 转换为响应格式
	response := make([]RoomMessageResponse, 0, len(messages))
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		// 获取用户信息
		var user models.User
		userName := ""
		userAvatar := ""
		if err := models.DB.Select("full_name, username, avatar").First(&user, msg.SenderID).Error; err == nil {
			userName = user.FullName
			if userName == "" {
				userName = user.Username
			}
			userAvatar = user.Avatar
		}

		response = append(response, RoomMessageResponse{
			ID:         msg.ID,
			Content:    msg.Content,
			UserID:     msg.SenderID,
			UserName:   userName,
			UserAvatar: userAvatar,
			RoomID:     msg.RoomID,
			CreatedAt:  msg.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	utils.Success(c, gin.H{
		"messages": response,
		"total":    total,
		"page":     page,
		"limit":    limit,
	}, "获取成功")
}

// SendRoomMessage 发送房间消息 /social/rooms/:id/messages
func (h *RoomHandler) SendRoomMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	roomID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的房间ID")
		return
	}

	// 检查房间是否存在
	var room models.Room
	if err := models.DB.First(&room, roomID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "房间不存在")
		return
	}

	// 检查是否是成员
	var member models.RoomMember
	if err := models.DB.Where("room_id = ? AND user_id = ?", roomID, currentUserID).First(&member).Error; err != nil {
		utils.Error(c, http.StatusForbidden, "您不是该房间的成员")
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error())
		return
	}

	// 创建消息
	message := models.RoomMessage{
		RoomID:   roomID,
		SenderID: currentUserID,
		Content:  req.Content,
	}

	if err := models.DB.Create(&message).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "发送消息失败")
		return
	}

	// 获取用户信息
	var user models.User
	userName := ""
	userAvatar := ""
	if err := models.DB.Select("full_name, username, avatar").First(&user, currentUserID).Error; err == nil {
		userName = user.FullName
		if userName == "" {
			userName = user.Username
		}
		userAvatar = user.Avatar
	}

	utils.Success(c, RoomMessageResponse{
		ID:         message.ID,
		Content:    message.Content,
		UserID:     message.SenderID,
		UserName:   userName,
		UserAvatar: userAvatar,
		RoomID:     message.RoomID,
		CreatedAt:  message.CreatedAt.Format("2006-01-02 15:04:05"),
	}, "发送成功")
}

// DeleteRoom 删除房间 /social/rooms/:id
func (h *RoomHandler) DeleteRoom(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)
	role, _ := c.Get("userRole")
	userRole := role.(string)

	roomID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的房间ID")
		return
	}

	// 查询房间
	var room models.Room
	if err := models.DB.First(&room, roomID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "房间不存在")
		return
	}

	// 检查权限（只有房主或管理员可以删除）
	if room.OwnerID != currentUserID && userRole != "admin" {
		utils.Error(c, http.StatusForbidden, "无权限删除此房间")
		return
	}

	// 软删除
	if err := models.DB.Delete(&room).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "删除房间失败")
		return
	}

	utils.Success(c, nil, "删除成功")
}
