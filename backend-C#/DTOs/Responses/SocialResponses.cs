namespace IMS.DTOs.Responses;

public class PostResponse
{
    public long Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public bool IsPublic { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
    public int Likes { get; set; }
    public int Comments { get; set; }
    public List<string> Images { get; set; } = new();
    public bool IsLiked { get; set; }
}

public class CommentResponse
{
    public long Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public long PostId { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class PostsListResponse
{
    public List<PostResponse> Posts { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}

public class CommentsListResponse
{
    public List<CommentResponse> Comments { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}

public class LikeToggleResponse
{
    public bool IsLiked { get; set; }
    public long Likes { get; set; }
}
