using IMS.Data;
using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Models;
using Microsoft.EntityFrameworkCore;

namespace IMS.Services;

public class RoomService : IRoomService
{
    private readonly ApplicationDbContext _context;

    public RoomService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RoomsListResponse> GetPublicRoomsAsync()
    {
        var rooms = await _context.Rooms
            .Where(r => r.IsActive)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var response = new List<RoomResponse>();
        foreach (var room in rooms)
        {
            var owner = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username })
                .FirstOrDefaultAsync(u => u.Id == room.OwnerId);

            var memberCount = await _context.RoomMembers.CountAsync(m => m.RoomId == room.Id);
            var messageCount = await _context.RoomMessages.CountAsync(m => m.RoomId == room.Id);

            response.Add(new RoomResponse
            {
                Id = room.Id,
                Name = room.Name,
                Description = room.Description,
                IsPublic = room.IsActive,
                OwnerId = room.OwnerId,
                OwnerName = owner?.FullName ?? owner?.Username ?? "",
                MemberCount = (int)memberCount,
                CreatedAt = room.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                MessageCount = (int)messageCount
            });
        }

        return new RoomsListResponse
        {
            Rooms = response,
            Total = response.Count
        };
    }

    public async Task<RoomsListResponse> GetMyRoomsAsync(long currentUserId)
    {
        // Get rooms where user is a member
        var memberships = await _context.RoomMembers
            .Where(m => m.UserId == currentUserId)
            .ToListAsync();

        var roomIds = memberships.Select(m => m.RoomId).ToList();

        var rooms = await _context.Rooms
            .Where(r => roomIds.Contains(r.Id) && r.IsActive)
            .ToListAsync();

        var response = new List<RoomResponse>();
        foreach (var room in rooms)
        {
            var owner = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username })
                .FirstOrDefaultAsync(u => u.Id == room.OwnerId);

            var memberCount = await _context.RoomMembers.CountAsync(m => m.RoomId == room.Id);
            var messageCount = await _context.RoomMessages.CountAsync(m => m.RoomId == room.Id);

            response.Add(new RoomResponse
            {
                Id = room.Id,
                Name = room.Name,
                Description = room.Description,
                IsPublic = room.IsActive,
                OwnerId = room.OwnerId,
                OwnerName = owner?.FullName ?? owner?.Username ?? "",
                MemberCount = (int)memberCount,
                CreatedAt = room.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                MessageCount = (int)messageCount
            });
        }

        return new RoomsListResponse
        {
            Rooms = response,
            Total = response.Count
        };
    }

    public async Task<RoomResponse?> GetRoomAsync(long roomId)
    {
        var room = await _context.Rooms.FindAsync(roomId);
        if (room == null) return null;

        var owner = await _context.Users
            .Select(u => new { u.Id, u.FullName, u.Username })
            .FirstOrDefaultAsync(u => u.Id == room.OwnerId);

        var memberCount = await _context.RoomMembers.CountAsync(m => m.RoomId == roomId);

        return new RoomResponse
        {
            Id = room.Id,
            Name = room.Name,
            Description = room.Description,
            IsPublic = room.IsActive,
            OwnerId = room.OwnerId,
            OwnerName = owner?.FullName ?? owner?.Username ?? "",
            MemberCount = (int)memberCount,
            CreatedAt = room.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        };
    }

    public async Task<RoomResponse> CreateRoomAsync(long currentUserId, CreateRoomRequest request)
    {
        var room = new Room
        {
            Name = request.Name,
            Description = request.Description,
            OwnerId = currentUserId,
            IsActive = request.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();

        // Add creator as owner member
        _context.RoomMembers.Add(new RoomMember
        {
            RoomId = room.Id,
            UserId = currentUserId,
            Role = "owner",
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var owner = await _context.Users
            .Select(u => new { u.Id, u.FullName, u.Username })
            .FirstOrDefaultAsync(u => u.Id == currentUserId);

        return new RoomResponse
        {
            Id = room.Id,
            Name = room.Name,
            Description = room.Description,
            IsPublic = request.IsPublic,
            OwnerId = currentUserId,
            OwnerName = owner?.FullName ?? owner?.Username ?? "",
            MemberCount = 1,
            CreatedAt = room.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        };
    }

    public async Task<bool> DeleteRoomAsync(long currentUserId, string userRole, long roomId)
    {
        var room = await _context.Rooms.FindAsync(roomId);
        if (room == null)
        {
            throw new InvalidOperationException("房间不存在");
        }

        // Check permission (only owner or admin can delete)
        if (room.OwnerId != currentUserId && userRole != "admin")
        {
            throw new InvalidOperationException("无权限删除此房间");
        }

        // Soft delete
        room.DeletedAt = DateTime.UtcNow;
        room.IsActive = false;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> JoinRoomAsync(long currentUserId, long roomId)
    {
        var room = await _context.Rooms.FindAsync(roomId);
        if (room == null)
        {
            throw new InvalidOperationException("房间不存在");
        }

        // Check if already member
        var existing = await _context.RoomMembers
            .FirstOrDefaultAsync(m => m.RoomId == roomId && m.UserId == currentUserId);

        if (existing != null)
        {
            throw new InvalidOperationException("您已经是该房间的成员");
        }

        _context.RoomMembers.Add(new RoomMember
        {
            RoomId = roomId,
            UserId = currentUserId,
            Role = "member",
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> LeaveRoomAsync(long currentUserId, long roomId)
    {
        var member = await _context.RoomMembers
            .FirstOrDefaultAsync(m => m.RoomId == roomId && m.UserId == currentUserId);

        if (member == null)
        {
            throw new InvalidOperationException("您不是该房间的成员");
        }

        _context.RoomMembers.Remove(member);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<RoomMembersResponse> GetRoomMembersAsync(long roomId)
    {
        var room = await _context.Rooms.FindAsync(roomId);
        if (room == null)
        {
            throw new InvalidOperationException("房间不存在");
        }

        var members = await _context.RoomMembers
            .Where(m => m.RoomId == roomId)
            .ToListAsync();

        var response = new List<RoomMemberResponse>();
        foreach (var member in members)
        {
            var user = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username, u.Avatar })
                .FirstOrDefaultAsync(u => u.Id == member.UserId);

            response.Add(new RoomMemberResponse
            {
                Id = member.Id,
                RoomId = member.RoomId,
                UserId = member.UserId,
                UserName = user?.FullName ?? user?.Username ?? "",
                UserAvatar = user?.Avatar,
                Role = member.Role,
                JoinedAt = member.JoinedAt.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        return new RoomMembersResponse
        {
            Members = response,
            Total = response.Count
        };
    }

    public async Task<RoomMessagesResponse> GetRoomMessagesAsync(long roomId, RoomMessagesRequest request)
    {
        var room = await _context.Rooms.FindAsync(roomId);
        if (room == null)
        {
            throw new InvalidOperationException("房间不存在");
        }

        var page = request.Page < 1 ? 1 : request.Page;
        var limit = request.Limit < 1 || request.Limit > 100 ? 50 : request.Limit;
        var offset = (page - 1) * limit;

        var total = await _context.RoomMessages.CountAsync(m => m.RoomId == roomId);

        var messages = await _context.RoomMessages
            .Where(m => m.RoomId == roomId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var response = new List<RoomMessageResponse>();
        foreach (var msg in messages.OrderBy(m => m.CreatedAt))
        {
            var user = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username, u.Avatar })
                .FirstOrDefaultAsync(u => u.Id == msg.SenderId);

            response.Add(new RoomMessageResponse
            {
                Id = msg.Id,
                Content = msg.Content,
                UserId = msg.SenderId,
                UserName = user?.FullName ?? user?.Username ?? "",
                UserAvatar = user?.Avatar,
                RoomId = msg.RoomId,
                CreatedAt = msg.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        return new RoomMessagesResponse
        {
            Messages = response,
            Total = total,
            Page = page,
            Limit = limit
        };
    }

    public async Task<RoomMessageResponse> SendRoomMessageAsync(long currentUserId, long roomId, SendRoomMessageRequest request)
    {
        var room = await _context.Rooms.FindAsync(roomId);
        if (room == null)
        {
            throw new InvalidOperationException("房间不存在");
        }

        // Check if member
        var isMember = await _context.RoomMembers
            .AnyAsync(m => m.RoomId == roomId && m.UserId == currentUserId);

        if (!isMember)
        {
            throw new InvalidOperationException("您不是该房间的成员");
        }

        var message = new RoomMessage
        {
            RoomId = roomId,
            SenderId = currentUserId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.RoomMessages.Add(message);
        await _context.SaveChangesAsync();

        var user = await _context.Users
            .Select(u => new { u.Id, u.FullName, u.Username, u.Avatar })
            .FirstOrDefaultAsync(u => u.Id == currentUserId);

        return new RoomMessageResponse
        {
            Id = message.Id,
            Content = message.Content,
            UserId = message.SenderId,
            UserName = user?.FullName ?? user?.Username ?? "",
            UserAvatar = user?.Avatar,
            RoomId = message.RoomId,
            CreatedAt = message.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        };
    }
}
