using System.ComponentModel.DataAnnotations;

namespace IMS.DTOs.Requests;

public class SendMessageRequest
{
    [Required]
    public long ReceiverId { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;
}

public class ChatHistoryRequest
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 50;
}
