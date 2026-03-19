namespace IMS.DTOs.Responses;

public class LoginResponse
{
    public UserInfo User { get; set; } = new();
    public string Token { get; set; } = string.Empty;
}

public class RegisterResponse
{
    public UserInfo User { get; set; } = new();
    public string Token { get; set; } = string.Empty;
}

public class UserInfo
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Avatar { get; set; }
    public string? Department { get; set; }
    public string? Position { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class ProfileInfo
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Avatar { get; set; }
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public string? Bio { get; set; }
    public string? Skills { get; set; }
    public string? Department { get; set; }
    public string? Position { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
