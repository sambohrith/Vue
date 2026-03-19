using IMS.Data;
using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Models;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace IMS.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthService(ApplicationDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, string clientIp)
    {
        // Check if username or email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Email);

        if (existingUser != null)
        {
            throw new InvalidOperationException("用户名或邮箱已被使用");
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            FullName = request.FullName ?? request.Username,
            Role = "user",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user.SetPassword(request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user.Id);

        Log.Information("User registered: {UserId} from {ClientIp}", user.Id, clientIp);

        return new RegisterResponse
        {
            User = MapToUserInfo(user),
            Token = token
        };
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, string clientIp)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null)
        {
            Log.Warning("Login failed: User not found - {Username} from {ClientIp}", 
                request.Username, clientIp);
            throw new InvalidOperationException("账号或密码错误");
        }

        if (!user.IsActive)
        {
            Log.Warning("Login failed: Account disabled - {Username} from {ClientIp}", 
                request.Username, clientIp);
            throw new InvalidOperationException("账户已被禁用，请联系管理员");
        }

        // Check password
        if (!user.ComparePassword(request.Password))
        {
            // Temporary: Plain text password comparison for legacy data
            if (user.Password != request.Password)
            {
                Log.Warning("Login failed: Wrong password - {Username} from {ClientIp}", 
                    request.Username, clientIp);
                throw new InvalidOperationException("账号或密码错误");
            }
            // Update to hashed password
            user.SetPassword(request.Password);
        }

        // Update login info
        user.UpdateLoginInfo();
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user.Id);

        Log.Information("User logged in: {UserId} - {Username} from {ClientIp}", 
            user.Id, user.Username, clientIp);

        return new LoginResponse
        {
            User = MapToUserInfo(user),
            Token = token
        };
    }

    public async Task<bool> LogoutAsync(long userId, string clientIp)
    {
        Log.Information("User logged out: {UserId} from {ClientIp}", userId, clientIp);
        return await Task.FromResult(true);
    }

    public async Task<UserInfo?> GetCurrentUserAsync(long userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user == null ? null : MapToUserInfo(user);
    }

    public async Task<ProfileInfo?> GetUserProfileAsync(long userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user == null ? null : MapToProfileInfo(user);
    }

    public async Task<bool> ChangePasswordAsync(long userId, ChangePasswordRequest request, string clientIp)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("用户不存在");
        }

        if (!user.ComparePassword(request.CurrentPassword))
        {
            throw new InvalidOperationException("当前密码不正确");
        }

        user.SetPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Log.Information("Password changed for user: {UserId} from {ClientIp}", userId, clientIp);
        return true;
    }

    public async Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var (isValid, userId) = _jwtService.ValidateToken(request.Token);
        
        if (!isValid || userId == null)
        {
            Log.Warning("Token refresh failed: Invalid token");
            throw new InvalidOperationException("令牌无效或已过期");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("用户不存在");
        }

        if (!user.IsActive)
        {
            throw new InvalidOperationException("账户已被禁用");
        }

        var newToken = _jwtService.GenerateToken(user.Id);

        return new LoginResponse
        {
            User = MapToUserInfo(user),
            Token = newToken
        };
    }

    private static UserInfo MapToUserInfo(User user)
    {
        return new UserInfo
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Avatar = user.Avatar,
            Department = user.Department,
            Position = user.Position,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }

    private static ProfileInfo MapToProfileInfo(User user)
    {
        return new ProfileInfo
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Avatar = user.Avatar,
            Phone = user.Phone,
            Gender = user.Gender,
            Bio = user.Bio,
            Skills = user.Skills,
            Department = user.Department,
            Position = user.Position,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }
}
