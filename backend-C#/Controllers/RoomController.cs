using IMS.DTOs;
using IMS.DTOs.Requests;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/social/rooms")]
[Authorize]
public class RoomController : BaseController
{
    private readonly IRoomService _roomService;

    public RoomController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet("public")]
    public async Task<ActionResult<ApiResponse>> GetPublicRooms()
    {
        var result = await _roomService.GetPublicRoomsAsync();
        return Success(new { rooms = result.Rooms, total = result.Total }, "获取成功");
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse>> GetMyRooms()
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var result = await _roomService.GetMyRoomsAsync(CurrentUserId.Value);
        return Success(new { rooms = result.Rooms, total = result.Total }, "获取成功");
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse>> GetRoom(long id)
    {
        var room = await _roomService.GetRoomAsync(id);
        if (room == null)
        {
            return Error("房间不存在", 404);
        }

        return Success(room, "获取成功");
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse>> CreateRoom([FromBody] CreateRoomRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            var room = await _roomService.CreateRoomAsync(CurrentUserId.Value, request);
            return Success(room, "创建成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse>> UpdateRoom(long id)
    {
        // Placeholder
        return Success(new { }, "更新成功");
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> DeleteRoom(long id)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            await _roomService.DeleteRoomAsync(CurrentUserId.Value, CurrentUserRole ?? "", id);
            return Success("删除成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPost("{id}/join")]
    public async Task<ActionResult<ApiResponse>> JoinRoom(long id)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            await _roomService.JoinRoomAsync(CurrentUserId.Value, id);
            return Success("加入成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPost("{id}/leave")]
    public async Task<ActionResult<ApiResponse>> LeaveRoom(long id)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            await _roomService.LeaveRoomAsync(CurrentUserId.Value, id);
            return Success("离开成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpGet("{id}/members")]
    public async Task<ActionResult<ApiResponse>> GetRoomMembers(long id)
    {
        try
        {
            var result = await _roomService.GetRoomMembersAsync(id);
            return Success(new { members = result.Members, total = result.Total }, "获取成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpGet("{id}/messages")]
    public async Task<ActionResult<ApiResponse>> GetRoomMessages(long id, [FromQuery] RoomMessagesRequest request)
    {
        try
        {
            var result = await _roomService.GetRoomMessagesAsync(id, request);
            return Success(new 
            { 
                messages = result.Messages, 
                total = result.Total, 
                page = result.Page, 
                limit = result.Limit 
            }, "获取成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPost("{id}/messages")]
    public async Task<ActionResult<ApiResponse>> SendRoomMessage(long id, [FromBody] SendRoomMessageRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            var message = await _roomService.SendRoomMessageAsync(CurrentUserId.Value, id, request);
            return Success(message, "发送成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }
}
