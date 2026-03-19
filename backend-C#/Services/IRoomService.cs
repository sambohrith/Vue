using IMS.DTOs.Requests;
using IMS.DTOs.Responses;

namespace IMS.Services;

public interface IRoomService
{
    Task<RoomsListResponse> GetPublicRoomsAsync();
    Task<RoomsListResponse> GetMyRoomsAsync(long currentUserId);
    Task<RoomResponse?> GetRoomAsync(long roomId);
    Task<RoomResponse> CreateRoomAsync(long currentUserId, CreateRoomRequest request);
    Task<bool> DeleteRoomAsync(long currentUserId, string userRole, long roomId);
    Task<bool> JoinRoomAsync(long currentUserId, long roomId);
    Task<bool> LeaveRoomAsync(long currentUserId, long roomId);
    Task<RoomMembersResponse> GetRoomMembersAsync(long roomId);
    Task<RoomMessagesResponse> GetRoomMessagesAsync(long roomId, RoomMessagesRequest request);
    Task<RoomMessageResponse> SendRoomMessageAsync(long currentUserId, long roomId, SendRoomMessageRequest request);
}
