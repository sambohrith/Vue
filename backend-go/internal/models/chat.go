package models

import (
	"time"

	"gorm.io/gorm"
)

// ChatMessage 聊天消息模型
type ChatMessage struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	SenderID   uint           `json:"senderId" gorm:"index;not null"`
	ReceiverID uint           `json:"receiverId" gorm:"index;not null"`
	Content    string         `json:"content" gorm:"type:text;not null"`
	IsRead     bool           `json:"isRead" gorm:"default:false"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Sender   User `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
	Receiver User `json:"receiver,omitempty" gorm:"foreignKey:ReceiverID"`
}

// TableName 指定表名
func (ChatMessage) TableName() string {
	return "chat_messages"
}

// Room 房间/群组模型
type Room struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"size:100;not null"`
	Description string         `json:"description" gorm:"type:text"`
	OwnerID     uint           `json:"ownerId" gorm:"index;not null"`
	IsActive    bool           `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Owner   User         `json:"owner,omitempty" gorm:"foreignKey:OwnerID"`
	Members []RoomMember `json:"members,omitempty" gorm:"foreignKey:RoomID"`
}

// TableName 指定表名
func (Room) TableName() string {
	return "rooms"
}

// RoomMember 房间成员模型
type RoomMember struct {
	ID       uint           `json:"id" gorm:"primaryKey"`
	RoomID   uint           `json:"roomId" gorm:"index;not null"`
	UserID   uint           `json:"userId" gorm:"index;not null"`
	Role     string         `json:"role" gorm:"default:'member';size:20"` // owner, admin, member
	JoinedAt time.Time      `json:"joinedAt" gorm:"autoCreateTime"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Room Room `json:"room,omitempty" gorm:"foreignKey:RoomID"`
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName 指定表名
func (RoomMember) TableName() string {
	return "room_members"
}

// RoomMessage 房间消息模型
type RoomMessage struct {
	ID       uint           `json:"id" gorm:"primaryKey"`
	RoomID   uint           `json:"roomId" gorm:"index;not null"`
	SenderID uint           `json:"senderId" gorm:"index;not null"`
	Content  string         `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Room   Room `json:"room,omitempty" gorm:"foreignKey:RoomID"`
	Sender User `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
}

// TableName 指定表名
func (RoomMessage) TableName() string {
	return "room_messages"
}
