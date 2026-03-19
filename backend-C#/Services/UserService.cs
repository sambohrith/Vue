using IMS.Data;
using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Models;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace IMS.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ListUsersResponse> ListUsersAsync(ListUsersRequest request)
    {
        var query = _context.Users.AsQueryable();

        // Search filter
        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = $"%{request.Search}%";
            query = query.Where(u => 
                EF.Functions.Like(u.Username, search) ||
                EF.Functions.Like(u.Email, search) ||
                (u.FullName != null && EF.Functions.Like(u.FullName, search)));
        }

        // Role filter
        if (!string.IsNullOrEmpty(request.Role))
        {
            query = query.Where(u => u.Role == request.Role);
        }

        // IsActive filter
        if (!string.IsNullOrEmpty(request.IsActive))
        {
            var isActive = request.IsActive.ToLower() == "true";
            query = query.Where(u => u.IsActive == isActive);
        }

        // Count total
        var total = await query.CountAsync();

        // Pagination
        var page = request.Page < 1 ? 1 : request.Page;
        var limit = request.Limit < 1 || request.Limit > 100 ? 10 : request.Limit;
        var offset = (page - 1) * limit;

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var totalPages = (int)Math.Ceiling((double)total / limit);

        return new ListUsersResponse
        {
            Users = users,
            Total = total,
            Page = page,
            Limit = limit,
            TotalPages = totalPages
        };
    }

    public async Task<User?> GetUserByIdAsync(long id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User> CreateUserAsync(CreateUserRequest request)
    {
        // Check username
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username);
        if (existingUser != null)
        {
            throw new InvalidOperationException("用户名已存在");
        }

        // Check email
        existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("邮箱已被注册");
        }

        var role = request.Role ?? "user";

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            FullName = request.FullName,
            Department = request.Department,
            Position = request.Position,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user.SetPassword(request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        Log.Information("User created: {UserId}", user.Id);
        return user;
    }

    public async Task<User> UpdateUserAsync(long id, UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            throw new InvalidOperationException("用户不存在");
        }

        // Check username uniqueness
        if (!string.IsNullOrEmpty(request.Username) && request.Username != user.Username)
        {
            var exists = await _context.Users
                .AnyAsync(u => u.Username == request.Username && u.Id != id);
            if (exists)
            {
                throw new InvalidOperationException("用户名已存在");
            }
            user.Username = request.Username;
        }

        // Check email uniqueness
        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            var exists = await _context.Users
                .AnyAsync(u => u.Email == request.Email && u.Id != id);
            if (exists)
            {
                throw new InvalidOperationException("邮箱已存在");
            }
            user.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.Password))
        {
            user.SetPassword(request.Password);
        }
        if (!string.IsNullOrEmpty(request.Role))
        {
            user.Role = request.Role;
        }
        if (request.IsActive.HasValue)
        {
            user.IsActive = request.IsActive.Value;
        }
        if (!string.IsNullOrEmpty(request.FullName))
        {
            user.FullName = request.FullName;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        Log.Information("User updated: {UserId}", id);
        return user;
    }

    public async Task<bool> DeleteUserAsync(long id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            throw new InvalidOperationException("用户不存在");
        }

        // Soft delete
        user.DeletedAt = DateTime.UtcNow;
        user.IsActive = false;
        await _context.SaveChangesAsync();

        Log.Information("User deleted: {UserId}", id);
        return true;
    }

    public async Task<User> ToggleUserActiveAsync(long id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            throw new InvalidOperationException("用户不存在");
        }

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<UserStats> GetUserStatsAsync()
    {
        var total = await _context.Users.CountAsync();
        var active = await _context.Users.CountAsync(u => u.IsActive);
        var admins = await _context.Users.CountAsync(u => u.Role == "admin");

        var recentUsers = await _context.Users
            .Where(u => u.IsActive)
            .OrderByDescending(u => u.CreatedAt)
            .Take(5)
            .ToListAsync();

        return new UserStats
        {
            Total = total,
            Active = active,
            Admins = admins,
            RecentUsers = recentUsers
        };
    }

    public async Task<List<User>> GetAllContactsAsync()
    {
        return await _context.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.Username)
            .ToListAsync();
    }

    public async Task<User> UpdateProfileAsync(long userId, UpdateProfileRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("用户不存在");
        }

        if (!string.IsNullOrEmpty(request.FullName))
            user.FullName = request.FullName;
        if (!string.IsNullOrEmpty(request.Phone))
            user.Phone = request.Phone;
        if (!string.IsNullOrEmpty(request.Department))
            user.Department = request.Department;
        if (!string.IsNullOrEmpty(request.Position))
            user.Position = request.Position;
        if (!string.IsNullOrEmpty(request.Gender))
            user.Gender = request.Gender;
        if (!string.IsNullOrEmpty(request.Bio))
            user.Bio = request.Bio;
        if (!string.IsNullOrEmpty(request.Skills))
            user.Skills = request.Skills;

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return user;
    }
}
