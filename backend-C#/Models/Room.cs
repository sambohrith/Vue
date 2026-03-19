using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IMS.Models;

[Table("rooms")]
public class Room
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("name")]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("owner_id")]
    public long OwnerId { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
    public ICollection<RoomMember>? Members { get; set; }
    public ICollection<RoomMessage>? Messages { get; set; }
}

[Table("room_members")]
public class RoomMember
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [Column("role")]
    [StringLength(20)]
    public string Role { get; set; } = "member";

    [Column("joined_at")]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room? Room { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }
}

[Table("room_messages")]
public class RoomMessage
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("sender_id")]
    public long SenderId { get; set; }

    [Required]
    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room? Room { get; set; }

    [ForeignKey("SenderId")]
    public User? Sender { get; set; }
}
