using IMS.Models;
using Microsoft.EntityFrameworkCore;

namespace IMS.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<RoomMember> RoomMembers { get; set; }
    public DbSet<RoomMessage> RoomMessages { get; set; }
    public DbSet<Post> Posts { get; set; }
    public DbSet<PostLike> PostLikes { get; set; }
    public DbSet<PostComment> PostComments { get; set; }
    public DbSet<SystemSettings> SystemSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasQueryFilter(u => u.DeletedAt == null);
        });

        // ChatMessage configuration
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasIndex(m => m.SenderId);
            entity.HasIndex(m => m.ReceiverId);
            entity.HasQueryFilter(m => m.DeletedAt == null);
            
            entity.HasOne(m => m.Sender)
                  .WithMany(u => u.SentMessages)
                  .HasForeignKey(m => m.SenderId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(m => m.Receiver)
                  .WithMany(u => u.ReceivedMessages)
                  .HasForeignKey(m => m.ReceiverId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Room configuration
        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasQueryFilter(r => r.DeletedAt == null);
            
            entity.HasOne(r => r.Owner)
                  .WithMany(u => u.OwnedRooms)
                  .HasForeignKey(r => r.OwnerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // RoomMember configuration
        modelBuilder.Entity<RoomMember>(entity =>
        {
            entity.HasIndex(rm => rm.RoomId);
            entity.HasIndex(rm => rm.UserId);
            entity.HasQueryFilter(rm => rm.DeletedAt == null);
            
            entity.HasOne(rm => rm.Room)
                  .WithMany(r => r.Members)
                  .HasForeignKey(rm => rm.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(rm => rm.User)
                  .WithMany(u => u.RoomMemberships)
                  .HasForeignKey(rm => rm.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // RoomMessage configuration
        modelBuilder.Entity<RoomMessage>(entity =>
        {
            entity.HasIndex(rm => rm.RoomId);
            entity.HasIndex(rm => rm.SenderId);
            entity.HasQueryFilter(rm => rm.DeletedAt == null);
            
            entity.HasOne(rm => rm.Room)
                  .WithMany(r => r.Messages)
                  .HasForeignKey(rm => rm.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(rm => rm.Sender)
                  .WithMany(u => u.RoomMessages)
                  .HasForeignKey(rm => rm.SenderId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Post configuration
        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasIndex(p => p.UserId);
            entity.HasQueryFilter(p => p.DeletedAt == null);
            
            entity.HasOne(p => p.Author)
                  .WithMany(u => u.Posts)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PostLike configuration
        modelBuilder.Entity<PostLike>(entity =>
        {
            entity.HasIndex(pl => pl.PostId);
            entity.HasIndex(pl => pl.UserId);
            entity.HasQueryFilter(pl => pl.DeletedAt == null);
            
            entity.HasOne(pl => pl.Post)
                  .WithMany(p => p.Likes)
                  .HasForeignKey(pl => pl.PostId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(pl => pl.User)
                  .WithMany(u => u.PostLikes)
                  .HasForeignKey(pl => pl.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PostComment configuration
        modelBuilder.Entity<PostComment>(entity =>
        {
            entity.HasIndex(pc => pc.PostId);
            entity.HasIndex(pc => pc.UserId);
            entity.HasIndex(pc => pc.ParentId);
            entity.HasQueryFilter(pc => pc.DeletedAt == null);
            
            entity.HasOne(pc => pc.Post)
                  .WithMany(p => p.Comments)
                  .HasForeignKey(pc => pc.PostId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(pc => pc.Author)
                  .WithMany(u => u.PostComments)
                  .HasForeignKey(pc => pc.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(pc => pc.Parent)
                  .WithMany(pc => pc.Replies)
                  .HasForeignKey(pc => pc.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // SystemSettings configuration
        modelBuilder.Entity<SystemSettings>(entity =>
        {
            entity.HasIndex(s => s.Key).IsUnique();
        });
    }
}
