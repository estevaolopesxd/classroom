using Classroom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Classroom.Infrastructure.Data.Configurations;

public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Title).HasMaxLength(200).IsRequired();
        builder.Property(l => l.Type).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(l => new { l.ModuleId, l.Order });

        builder.HasOne(l => l.Module)
            .WithMany(m => m.Lessons)
            .HasForeignKey(l => l.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.Video)
            .WithMany()
            .HasForeignKey(l => l.VideoId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
