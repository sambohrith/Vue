namespace IMS.DTOs.Responses;

public class ChatContactResponse
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? LastMessage { get; set; }
    public string? LastMessageTime { get; set; }
    public long UnreadCount { get; set; }
}

public class ChatMessageResponse
{
    public long Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public long SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public long ReceiverId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class ChatListResponse
{
    public List<ChatContactResponse> Contacts { get; set; } = new();
    public int Total { get; set; }
}

public class ChatHistoryResponse
{
    public List<ChatMessageResponse> Messages { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}

public class UnreadCountResponse
{
    public long UnreadCount { get; set; }
}
