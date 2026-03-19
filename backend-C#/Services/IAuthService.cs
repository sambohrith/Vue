using IMS.DTOs.Requests;
using IMS.DTOs.Responses;

namespace IMS.Services;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, string clientIp);
    Task<LoginResponse> LoginAsync(LoginRequest request, string clientIp);
    Task<bool> LogoutAsync(long userId, string clientIp);
    Task<UserInfo?> GetCurrentUserAsync(long userId);
    Task<ProfileInfo?> GetUserProfileAsync(long userId);
    Task<bool> ChangePasswordAsync(long userId, ChangePasswordRequest request, string clientIp);
    Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request);
}
