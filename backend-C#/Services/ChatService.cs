using IMS.Data;
using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Models;
using Microsoft.EntityFrameworkCore;

namespace IMS.Services;

public class ChatService : IChatService
{
    private readonly ApplicationDbContext _context;

    public ChatService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ChatListResponse> GetChatListAsync(long currentUserId)
    {
        // Get all other active users as contacts
        var users = await _context.Users
            .Where(u => u.Id != currentUserId && u.IsActive)
            .ToListAsync();

        var contacts = new List<ChatContactResponse>();

        foreach (var user in users)
        {
            var contact = new ChatContactResponse
            {
                Id = user.Id,
                UserId = user.Id,
                Name = user.FullName ?? user.Username,
                Email = user.Email,
                Avatar = user.Avatar
            };

            // Get last message
            var lastMsg = await _context.ChatMessages
                .Where(m => (m.SenderId == currentUserId && m.ReceiverId == user.Id) ||
                           (m.SenderId == user.Id && m.ReceiverId == currentUserId))
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();

            if (lastMsg != null)
            {
                contact.LastMessage = lastMsg.Content;
                contact.LastMessageTime = lastMsg.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
            }

            // Get unread count
            contact.UnreadCount = await _context.ChatMessages
                .CountAsync(m => m.SenderId == user.Id && m.ReceiverId == currentUserId && !m.IsRead);

            contacts.Add(contact);
        }

        return new ChatListResponse
        {
            Contacts = contacts,
            Total = contacts.Count
        };
    }

    public async Task<ChatHistoryResponse> GetChatHistoryAsync(long currentUserId, long otherUserId, ChatHistoryRequest request)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var limit = request.Limit < 1 || request.Limit > 100 ? 50 : request.Limit;
        var offset = (page - 1) * limit;

        // Count total
        var total = await _context.ChatMessages
            .CountAsync(m => (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                            (m.SenderId == otherUserId && m.ReceiverId == currentUserId));

        // Get messages
        var messages = await _context.ChatMessages
            .Where(m => (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                       (m.SenderId == otherUserId && m.ReceiverId == currentUserId))
            .OrderByDescending(m => m.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var response = new List<ChatMessageResponse>();
        foreach (var msg in messages.OrderBy(m => m.CreatedAt))
        {
            var sender = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username })
                .FirstOrDefaultAsync(u => u.Id == msg.SenderId);

            var receiver = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username })
                .FirstOrDefaultAsync(u => u.Id == msg.ReceiverId);

            response.Add(new ChatMessageResponse
            {
                Id = msg.Id,
                Content = msg.Content,
                SenderId = msg.SenderId,
                SenderName = sender?.FullName ?? sender?.Username ?? "",
                ReceiverId = msg.ReceiverId,
                ReceiverName = receiver?.FullName ?? receiver?.Username ?? "",
                IsRead = msg.IsRead,
                CreatedAt = msg.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        return new ChatHistoryResponse
        {
            Messages = response,
            Total = total,
            Page = page,
            Limit = limit
        };
    }

    public async Task<ChatMessageResponse> SendMessageAsync(long currentUserId, SendMessageRequest request)
    {
        // Check receiver exists
        var receiver = await _context.Users.FindAsync(request.ReceiverId);
        if (receiver == null)
        {
            throw new InvalidOperationException("接收者不存在");
        }

        var message = new ChatMessage
        {
            SenderId = currentUserId,
            ReceiverId = request.ReceiverId,
            Content = request.Content,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        var sender = await _context.Users
            .Select(u => new { u.Id, u.FullName, u.Username })
            .FirstOrDefaultAsync(u => u.Id == currentUserId);

        return new ChatMessageResponse
        {
            Id = message.Id,
            Content = message.Content,
            SenderId = message.SenderId,
            SenderName = sender?.FullName ?? sender?.Username ?? "",
            ReceiverId = message.ReceiverId,
            ReceiverName = receiver.FullName ?? receiver.Username ?? "",
            IsRead = message.IsRead,
            CreatedAt = message.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        };
    }

    public async Task<long> MarkAsReadAsync(long currentUserId, long otherUserId)
    {
        var messages = await _context.ChatMessages
            .Where(m => m.SenderId == otherUserId && m.ReceiverId == currentUserId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in messages)
        {
            msg.IsRead = true;
        }

        await _context.SaveChangesAsync();
        return messages.Count;
    }

    public async Task<long> GetUnreadCountAsync(long currentUserId)
    {
        return await _context.ChatMessages
            .CountAsync(m => m.ReceiverId == currentUserId && !m.IsRead);
    }

    public async Task<ChatHistoryResponse> GetAllMessagesAsync(long currentUserId, int page, int limit, string? search)
    {
        page = page < 1 ? 1 : page;
        limit = limit < 1 || limit > 100 ? 50 : limit;
        var offset = (page - 1) * limit;

        var query = _context.ChatMessages.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(m => EF.Functions.Like(m.Content, $"%{search}%"));
        }

        var total = await query.CountAsync();

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var response = new List<ChatMessageResponse>();
        foreach (var msg in messages)
        {
            var sender = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username })
                .FirstOrDefaultAsync(u => u.Id == msg.SenderId);

            var receiver = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username })
                .FirstOrDefaultAsync(u => u.Id == msg.ReceiverId);

            response.Add(new ChatMessageResponse
            {
                Id = msg.Id,
                Content = msg.Content,
                SenderId = msg.SenderId,
                SenderName = sender?.FullName ?? sender?.Username ?? "",
                ReceiverId = msg.ReceiverId,
                ReceiverName = receiver?.FullName ?? receiver?.Username ?? "",
                IsRead = msg.IsRead,
                CreatedAt = msg.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        return new ChatHistoryResponse
        {
            Messages = response,
            Total = total,
            Page = page,
            Limit = limit
        };
    }

    public async Task<ChatListResponse> GetAllConversationsAsync(long currentUserId, int page, int limit, string? search)
    {
        page = page < 1 ? 1 : page;
        limit = limit < 1 || limit > 100 ? 50 : limit;
        var offset = (page - 1) * limit;

        var query = _context.Users.Where(u => u.IsActive).AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => 
                EF.Functions.Like(u.Username, $"%{search}%") ||
                (u.FullName != null && EF.Functions.Like(u.FullName, $"%{search}%")) ||
                EF.Functions.Like(u.Email, $"%{search}%"));
        }

        var total = await query.CountAsync();

        var users = await query
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var conversations = new List<ChatContactResponse>();
        foreach (var user in users)
        {
            var name = user.FullName ?? user.Username;

            // Get last message
            var lastMsg = await _context.ChatMessages
                .Where(m => m.SenderId == user.Id || m.ReceiverId == user.Id)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();

            var unreadCount = await _context.ChatMessages
                .CountAsync(m => m.ReceiverId == user.Id && !m.IsRead);

            conversations.Add(new ChatContactResponse
            {
                Id = user.Id,
                UserId = user.Id,
                Name = name,
                Email = user.Email,
                Avatar = user.Avatar,
                LastMessage = lastMsg?.Content,
                LastMessageTime = lastMsg?.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                UnreadCount = unreadCount
            });
        }

        return new ChatListResponse
        {
            Contacts = conversations,
            Total = total
        };
    }
}
