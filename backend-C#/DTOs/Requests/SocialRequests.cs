using System.ComponentModel.DataAnnotations;

namespace IMS.DTOs.Requests;

public class CreatePostRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;

    public bool? IsPublic { get; set; } = true;

    public List<string>? Images { get; set; }
}

public class AddCommentRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;
}

public class ListPostsRequest
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 10;
}
