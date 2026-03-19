using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IMS.Models;

[Table("posts")]
public class Post
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [Required]
    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("images")]
    public string? Images { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public User? Author { get; set; }
    public ICollection<PostLike>? Likes { get; set; }
    public ICollection<PostComment>? Comments { get; set; }

    // Non-persistent statistics
    [NotMapped]
    public int LikeCount { get; set; }

    [NotMapped]
    public int CommentCount { get; set; }
}

[Table("post_likes")]
public class PostLike
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("post_id")]
    public long PostId { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    [ForeignKey("PostId")]
    public Post? Post { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }
}

[Table("post_comments")]
public class PostComment
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("post_id")]
    public long PostId { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [Column("parent_id")]
    public long? ParentId { get; set; }

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
    [ForeignKey("PostId")]
    public Post? Post { get; set; }

    [ForeignKey("UserId")]
    public User? Author { get; set; }

    [ForeignKey("ParentId")]
    public PostComment? Parent { get; set; }

    public ICollection<PostComment>? Replies { get; set; }
}
