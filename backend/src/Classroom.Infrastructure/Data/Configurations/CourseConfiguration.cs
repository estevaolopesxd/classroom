using Classroom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Classroom.Infrastructure.Data.Configurations;

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Title).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Slug).HasMaxLength(220).IsRequired();
        builder.HasIndex(c => c.Slug).IsUnique();
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.PricingType).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Price).HasPrecision(10, 2);
        builder.Property(c => c.Currency).HasMaxLength(3);
        builder.Property(c => c.StripePriceId).HasMaxLength(100);
        builder.Property(c => c.StripeProductId).HasMaxLength(100);

        builder.HasOne(c => c.CreatedBy)
            .WithMany()
            .HasForeignKey(c => c.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.TrailerVideo)
            .WithMany()
            .HasForeignKey(c => c.TrailerVideoId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
