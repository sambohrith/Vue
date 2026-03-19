using IMS.DTOs;
using IMS.DTOs.Requests;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : BaseController
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse>> GetChatList()
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var result = await _chatService.GetChatListAsync(CurrentUserId.Value);
        return Success(new { contacts = result.Contacts, total = result.Total }, "获取成功");
    }

    [HttpGet("history/{userId}")]
    public async Task<ActionResult<ApiResponse>> GetChatHistory(long userId, [FromQuery] ChatHistoryRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var result = await _chatService.GetChatHistoryAsync(CurrentUserId.Value, userId, request);
        return Success(new 
        { 
            messages = result.Messages, 
            total = result.Total, 
            page = result.Page, 
            limit = result.Limit 
        }, "获取成功");
    }

    [HttpPost("send")]
    public async Task<ActionResult<ApiResponse>> SendMessage([FromBody] SendMessageRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        if (request.ReceiverId == CurrentUserId.Value)
        {
            return Error("不能给自己发送消息", 400);
        }

        try
        {
            var message = await _chatService.SendMessageAsync(CurrentUserId.Value, request);
            return Success(message, "发送成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPut("read/{userId}")]
    public async Task<ActionResult<ApiResponse>> MarkAsRead(long userId)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var count = await _chatService.MarkAsReadAsync(CurrentUserId.Value, userId);
        return Success(new { markedCount = count }, "标记成功");
    }

    [HttpGet("unread")]
    public async Task<ActionResult<ApiResponse>> GetUnreadCount()
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var count = await _chatService.GetUnreadCountAsync(CurrentUserId.Value);
        return Success(new { unreadCount = count }, "获取成功");
    }

    [HttpGet("admin/messages")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> GetAllMessages(
        [FromQuery] int page = 1, 
        [FromQuery] int limit = 50, 
        [FromQuery] string? search = null)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var result = await _chatService.GetAllMessagesAsync(CurrentUserId.Value, page, limit, search);
        return Success(new 
        { 
            messages = result.Messages, 
            total = result.Total 
        }, "获取成功");
    }

    [HttpGet("admin/conversations")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> GetAllConversations(
        [FromQuery] int page = 1, 
        [FromQuery] int limit = 50, 
        [FromQuery] string? search = null)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var result = await _chatService.GetAllConversationsAsync(CurrentUserId.Value, page, limit, search);
        return Success(new 
        { 
            conversations = result.Contacts, 
            total = result.Total 
        }, "获取成功");
    }
}
