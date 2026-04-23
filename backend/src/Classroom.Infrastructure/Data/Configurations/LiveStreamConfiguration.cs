using Classroom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Classroom.Infrastructure.Data.Configurations;

public class LiveStreamConfiguration : IEntityTypeConfiguration<LiveStream>
{
    public void Configure(EntityTypeBuilder<LiveStream> builder)
    {
        builder.HasKey(ls => ls.Id);
        builder.Property(ls => ls.Title).HasMaxLength(200).IsRequired();
        builder.Property(ls => ls.StreamKey).HasMaxLength(100).IsRequired();
        builder.HasIndex(ls => ls.StreamKey).IsUnique();
        builder.Property(ls => ls.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(ls => ls.Lesson)
            .WithMany()
            .HasForeignKey(ls => ls.LessonId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(ls => ls.RecordingVideo)
            .WithMany()
            .HasForeignKey(ls => ls.RecordingVideoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(ls => ls.CreatedBy)
            .WithMany()
            .HasForeignKey(ls => ls.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
