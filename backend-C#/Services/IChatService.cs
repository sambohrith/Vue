using IMS.DTOs.Requests;
using IMS.DTOs.Responses;

namespace IMS.Services;

public interface IChatService
{
    Task<ChatListResponse> GetChatListAsync(long currentUserId);
    Task<ChatHistoryResponse> GetChatHistoryAsync(long currentUserId, long otherUserId, ChatHistoryRequest request);
    Task<ChatMessageResponse> SendMessageAsync(long currentUserId, SendMessageRequest request);
    Task<long> MarkAsReadAsync(long currentUserId, long otherUserId);
    Task<long> GetUnreadCountAsync(long currentUserId);
    Task<ChatHistoryResponse> GetAllMessagesAsync(long currentUserId, int page, int limit, string? search);
    Task<ChatListResponse> GetAllConversationsAsync(long currentUserId, int page, int limit, string? search);
}
