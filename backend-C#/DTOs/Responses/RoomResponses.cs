namespace IMS.DTOs.Responses;

public class RoomResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public long OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public string? InviteCode { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public int MessageCount { get; set; }
}

public class RoomMemberResponse
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string Role { get; set; } = string.Empty;
    public string JoinedAt { get; set; } = string.Empty;
}

public class RoomMessageResponse
{
    public long Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public long RoomId { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class RoomsListResponse
{
    public List<RoomResponse> Rooms { get; set; } = new();
    public int Total { get; set; }
}

public class RoomMembersResponse
{
    public List<RoomMemberResponse> Members { get; set; } = new();
    public int Total { get; set; }
}

public class RoomMessagesResponse
{
    public List<RoomMessageResponse> Messages { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}
