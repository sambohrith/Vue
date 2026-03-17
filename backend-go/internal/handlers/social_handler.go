package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/models"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
)

// SocialHandler 社交处理器
type SocialHandler struct{}

// NewSocialHandler 创建社交处理器
func NewSocialHandler() *SocialHandler {
	return &SocialHandler{}
}

// PostResponse 帖子响应
type PostResponse struct {
	ID            int64              `json:"id"`
	Content       string             `json:"content"`
	UserID        int64              `json:"userId"`
	UserName      string             `json:"userName"`
	UserAvatar    string             `json:"userAvatar"`
	IsPublic      bool               `json:"isPublic"`
	CreatedAt     string             `json:"createdAt"`
	UpdatedAt     string             `json:"updatedAt"`
	Likes         int                `json:"likes"`
	Comments      int                `json:"comments"`
	Images        []string           `json:"images"`
	IsLiked       bool               `json:"isLiked"`
}

// CommentResponse 评论响应
type CommentResponse struct {
	ID         int64  `json:"id"`
	Content    string `json:"content"`
	UserID     int64  `json:"userId"`
	UserName   string `json:"userName"`
	UserAvatar string `json:"userAvatar"`
	PostID     int64  `json:"postId"`
	CreatedAt  string `json:"createdAt"`
}

// CreatePostRequest 创建帖子请求
type CreatePostRequest struct {
	Content  string   `json:"content" binding:"required"`
	IsPublic *bool    `json:"isPublic"`
	Images   []string `json:"images"`
}

// GetPosts 获取帖子列表 /social/posts
func (h *SocialHandler) GetPosts(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	// 查询帖子总数
	var total int64
	models.DB.Model(&models.Post{}).Where("is_active = ?", true).Count(&total)

	// 查询帖子
	var posts []models.Post
	if err := models.DB.Where("is_active = ?", true).Order("created_at DESC").Limit(limit).Offset(offset).Find(&posts).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取帖子失败")
		return
	}

	// 转换为响应格式
	response := make([]PostResponse, 0, len(posts))
	for _, post := range posts {
		// 获取作者信息
		var author models.User
		authorName := ""
		authorAvatar := ""
		if err := models.DB.Select("full_name, username, avatar").First(&author, post.UserID).Error; err == nil {
			authorName = author.FullName
			if authorName == "" {
				authorName = author.Username
			}
			authorAvatar = author.Avatar
		}

		// 获取点赞数
		var likeCount int64
		models.DB.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likeCount)

		// 获取评论数
		var commentCount int64
		models.DB.Model(&models.PostComment{}).Where("post_id = ?", post.ID).Count(&commentCount)

		// 检查当前用户是否点赞
		var isLiked int64
		models.DB.Model(&models.PostLike{}).Where("post_id = ? AND user_id = ?", post.ID, currentUserID).Count(&isLiked)

		// 解析图片
		images := []string{}
		if post.Images != "" {
			// 简单处理，假设是逗号分隔的URL
			// 实际应该是JSON解析
		}

		isPublic := true
		response = append(response, PostResponse{
			ID:         post.ID,
			Content:    post.Content,
			UserID:     post.UserID,
			UserName:   authorName,
			UserAvatar: authorAvatar,
			IsPublic:   isPublic,
			CreatedAt:  post.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:  post.UpdatedAt.Format("2006-01-02 15:04:05"),
			Likes:      int(likeCount),
			Comments:   int(commentCount),
			Images:     images,
			IsLiked:    isLiked > 0,
		})
	}

	utils.Success(c, gin.H{
		"posts": response,
		"total": total,
		"page":  page,
		"limit": limit,
	}, "获取成功")
}

// CreatePost 创建帖子 /social/posts
func (h *SocialHandler) CreatePost(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	var req CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error())
		return
	}

	// 默认公开
	isPublic := true
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}
	_ = isPublic

	// 创建帖子
	post := models.Post{
		UserID:   currentUserID,
		Content:  req.Content,
		IsActive: true,
	}

	if err := models.DB.Create(&post).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "创建帖子失败")
		return
	}

	// 获取作者信息
	var author models.User
	authorName := ""
	authorAvatar := ""
	if err := models.DB.Select("full_name, username, avatar").First(&author, currentUserID).Error; err == nil {
		authorName = author.FullName
		if authorName == "" {
			authorName = author.Username
		}
		authorAvatar = author.Avatar
	}

	utils.Success(c, PostResponse{
		ID:        post.ID,
		Content:   post.Content,
		UserID:    post.UserID,
		UserName:  authorName,
		UserAvatar: authorAvatar,
		IsPublic:  true,
		CreatedAt: post.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: post.UpdatedAt.Format("2006-01-02 15:04:05"),
		Likes:     0,
		Comments:  0,
		Images:    req.Images,
		IsLiked:   false,
	}, "创建成功")
}

// DeletePost 删除帖子 /social/posts/:id
func (h *SocialHandler) DeletePost(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)
	role, _ := c.Get("userRole")
	userRole := role.(string)

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的帖子ID")
		return
	}

	// 查询帖子
	var post models.Post
	if err := models.DB.First(&post, postID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "帖子不存在")
		return
	}

	// 检查权限（只有作者或管理员可以删除）
	if post.UserID != currentUserID && userRole != "admin" {
		utils.Error(c, http.StatusForbidden, "无权限删除此帖子")
		return
	}

	// 软删除
	if err := models.DB.Delete(&post).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "删除帖子失败")
		return
	}

	utils.Success(c, nil, "删除成功")
}

// ToggleLike 点赞/取消点赞 /social/posts/:id/like
func (h *SocialHandler) ToggleLike(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的帖子ID")
		return
	}

	// 检查帖子是否存在
	var post models.Post
	if err := models.DB.First(&post, postID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "帖子不存在")
		return
	}

	// 检查是否已点赞
	var like models.PostLike
	result := models.DB.Where("post_id = ? AND user_id = ?", postID, currentUserID).First(&like)

	isLiked := false
	if result.Error == nil {
		// 已点赞，取消点赞
		models.DB.Delete(&like)
	} else {
		// 未点赞，添加点赞
		like = models.PostLike{
			PostID: postID,
			UserID: currentUserID,
		}
		models.DB.Create(&like)
		isLiked = true
	}

	// 获取最新点赞数
	var likeCount int64
	models.DB.Model(&models.PostLike{}).Where("post_id = ?", postID).Count(&likeCount)

	utils.Success(c, gin.H{
		"isLiked": isLiked,
		"likes":   likeCount,
	}, "操作成功")
}

// GetComments 获取评论列表 /social/posts/:id/comments
func (h *SocialHandler) GetComments(c *gin.Context) {
	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的帖子ID")
		return
	}

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	// 查询评论总数
	var total int64
	models.DB.Model(&models.PostComment{}).Where("post_id = ?", postID).Count(&total)

	// 查询评论
	var comments []models.PostComment
	if err := models.DB.Where("post_id = ?", postID).Order("created_at DESC").Limit(limit).Offset(offset).Find(&comments).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "获取评论失败")
		return
	}

	// 转换为响应格式
	response := make([]CommentResponse, 0, len(comments))
	for _, comment := range comments {
		// 获取作者信息
		var author models.User
		authorName := ""
		authorAvatar := ""
		if err := models.DB.Select("full_name, username, avatar").First(&author, comment.UserID).Error; err == nil {
			authorName = author.FullName
			if authorName == "" {
				authorName = author.Username
			}
			authorAvatar = author.Avatar
		}

		response = append(response, CommentResponse{
			ID:         comment.ID,
			Content:    comment.Content,
			UserID:     comment.UserID,
			UserName:   authorName,
			UserAvatar: authorAvatar,
			PostID:     comment.PostID,
			CreatedAt:  comment.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	utils.Success(c, gin.H{
		"comments": response,
		"total":    total,
		"page":     page,
		"limit":    limit,
	}, "获取成功")
}

// AddComment 添加评论 /social/posts/:id/comment
func (h *SocialHandler) AddComment(c *gin.Context) {
	userID, _ := c.Get("userID")
	currentUserID := userID.(int64)

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的帖子ID")
		return
	}

	// 检查帖子是否存在
	var post models.Post
	if err := models.DB.First(&post, postID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "帖子不存在")
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error())
		return
	}

	// 创建评论
	comment := models.PostComment{
		PostID:  postID,
		UserID:  currentUserID,
		Content: req.Content,
	}

	if err := models.DB.Create(&comment).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "添加评论失败")
		return
	}

	// 获取作者信息
	var author models.User
	authorName := ""
	authorAvatar := ""
	if err := models.DB.Select("full_name, username, avatar").First(&author, currentUserID).Error; err == nil {
		authorName = author.FullName
		if authorName == "" {
			authorName = author.Username
		}
		authorAvatar = author.Avatar
	}

	utils.Success(c, CommentResponse{
		ID:         comment.ID,
		Content:    comment.Content,
		UserID:     comment.UserID,
		UserName:   authorName,
		UserAvatar: authorAvatar,
		PostID:     comment.PostID,
		CreatedAt:  comment.CreatedAt.Format("2006-01-02 15:04:05"),
	}, "评论成功")
}
