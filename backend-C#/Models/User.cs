using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Security.Cryptography;
using System.Text;

namespace IMS.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("username")]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [Column("email")]
    [StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("password")]
    public string Password { get; set; } = string.Empty;

    [Column("full_name")]
    [StringLength(100)]
    public string? FullName { get; set; }

    [Column("avatar")]
    [StringLength(255)]
    public string? Avatar { get; set; }

    [Column("phone")]
    [StringLength(20)]
    public string? Phone { get; set; }

    [Column("gender")]
    [StringLength(10)]
    public string? Gender { get; set; }

    [Column("bio")]
    public string? Bio { get; set; }

    [Column("skills")]
    public string? Skills { get; set; }

    [Column("department")]
    [StringLength(100)]
    public string? Department { get; set; }

    [Column("position")]
    [StringLength(100)]
    public string? Position { get; set; }

    [Column("role")]
    [StringLength(20)]
    public string Role { get; set; } = "user";

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("last_login_at")]
    public DateTime? LastLoginAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ICollection<ChatMessage>? SentMessages { get; set; }
    public ICollection<ChatMessage>? ReceivedMessages { get; set; }
    public ICollection<Post>? Posts { get; set; }
    public ICollection<PostLike>? PostLikes { get; set; }
    public ICollection<PostComment>? PostComments { get; set; }
    public ICollection<Room>? OwnedRooms { get; set; }
    public ICollection<RoomMember>? RoomMemberships { get; set; }
    public ICollection<RoomMessage>? RoomMessages { get; set; }

    // Helper methods - MD5 encryption
    public bool ComparePassword(string password)
    {
        return Password == ComputeHash(password);
    }

    public void SetPassword(string password)
    {
        Password = ComputeHash(password);
    }

    public static string ComputeHash(string input)
    {
        using var md5 = System.Security.Cryptography.MD5.Create();
        var inputBytes = System.Text.Encoding.UTF8.GetBytes(input);
        var hashBytes = md5.ComputeHash(inputBytes);
        return Convert.ToHexString(hashBytes).ToLower();
    }

    public void UpdateLoginInfo()
    {
        LastLoginAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}

public class UserStats
{
    public long Total { get; set; }
    public long Active { get; set; }
    public long Admins { get; set; }
    public List<User> RecentUsers { get; set; } = new();
}
