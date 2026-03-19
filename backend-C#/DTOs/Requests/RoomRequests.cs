using System.ComponentModel.DataAnnotations;

namespace IMS.DTOs.Requests;

public class CreateRoomRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsPublic { get; set; } = true;
}

public class SendRoomMessageRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;
}

public class RoomMessagesRequest
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 50;
}
