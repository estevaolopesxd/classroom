using Classroom.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Classroom.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Video> Videos => Set<Video>();
    public DbSet<LiveStream> LiveStreams => Set<LiveStream>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<CourseEnrollment> CourseEnrollments => Set<CourseEnrollment>();
    public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();
    public DbSet<ThemeConfig> ThemeConfigs => Set<ThemeConfig>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<CertificateConfig> CertificateConfigs => Set<CertificateConfig>();
    public DbSet<CertificateSponsor> CertificateSponsors => Set<CertificateSponsor>();
    public DbSet<LessonComment> LessonComments => Set<LessonComment>();
    public DbSet<CourseRating> CourseRatings => Set<CourseRating>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Domain.Common.BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
