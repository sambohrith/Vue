using System.ComponentModel.DataAnnotations;

namespace IMS.DTOs.Requests;

public class ListUsersRequest
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 10;
    public string? Search { get; set; }
    public string? Role { get; set; }
    public string? IsActive { get; set; }
}

public class CreateUserRequest
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [StringLength(100)]
    public string? FullName { get; set; }

    [StringLength(100)]
    public string? Department { get; set; }

    [StringLength(100)]
    public string? Position { get; set; }

    public string? Role { get; set; }
}

public class UpdateUserRequest
{
    [StringLength(50, MinimumLength = 3)]
    public string? Username { get; set; }

    [EmailAddress]
    [StringLength(100)]
    public string? Email { get; set; }

    [StringLength(100)]
    public string? Password { get; set; }

    public string? Role { get; set; }
    public bool? IsActive { get; set; }

    [StringLength(100)]
    public string? FullName { get; set; }
}

public class UpdateProfileRequest
{
    [StringLength(100)]
    public string? FullName { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(100)]
    public string? Department { get; set; }

    [StringLength(100)]
    public string? Position { get; set; }

    [StringLength(10)]
    public string? Gender { get; set; }

    public string? Bio { get; set; }

    public string? Skills { get; set; }
}
