package models

import (
	"time"

	"gorm.io/gorm"
)

// Post 帖子/动态模型
type Post struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"userId" gorm:"index;not null"`
	Content   string         `json:"content" gorm:"type:text;not null"`
	Images    string         `json:"images" gorm:"type:text"` // JSON数组存储图片URL
	IsActive  bool           `json:"isActive" gorm:"default:true"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Author   User          `json:"author,omitempty" gorm:"foreignKey:UserID"`
	Likes    []PostLike    `json:"likes,omitempty" gorm:"foreignKey:PostID"`
	Comments []PostComment `json:"comments,omitempty" gorm:"foreignKey:PostID"`
	
	// 统计字段（非持久化）
	LikeCount    int `json:"likeCount" gorm:"-"`
	CommentCount int `json:"commentCount" gorm:"-"`
}

// TableName 指定表名
func (Post) TableName() string {
	return "posts"
}

// PostLike 帖子点赞模型
type PostLike struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	PostID    uint           `json:"postId" gorm:"index;not null"`
	UserID    uint           `json:"userId" gorm:"index;not null"`
	CreatedAt time.Time      `json:"createdAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Post Post `json:"post,omitempty" gorm:"foreignKey:PostID"`
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName 指定表名
func (PostLike) TableName() string {
	return "post_likes"
}

// PostComment 帖子评论模型
type PostComment struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	PostID    uint           `json:"postId" gorm:"index;not null"`
	UserID    uint           `json:"userId" gorm:"index;not null"`
	ParentID  *uint          `json:"parentId" gorm:"index"` // 回复的评论ID
	Content   string         `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Post     Post          `json:"post,omitempty" gorm:"foreignKey:PostID"`
	Author   User          `json:"author,omitempty" gorm:"foreignKey:UserID"`
	Parent   *PostComment  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Replies  []PostComment `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
}

// TableName 指定表名
func (PostComment) TableName() string {
	return "post_comments"
}

// SystemSettings 系统设置模型
type SystemSettings struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Key       string    `json:"key" gorm:"uniqueIndex;not null;size:100"`
	Value     string    `json:"value" gorm:"type:text"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TableName 指定表名
func (SystemSettings) TableName() string {
	return "system_settings"
}
