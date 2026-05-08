using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/progress")]
[Authorize]
public class ProgressController(AppDbContext db, IConfiguration configuration) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("lessons/{lessonId:guid}")]
    public async Task<IActionResult> UpdateProgress(Guid lessonId, [FromBody] UpdateProgressRequest request)
    {
        var userId = CurrentUserId;
        var lesson = await db.Lessons.FindAsync(lessonId);
        if (lesson is null) return NotFound();

        var progress = await db.LessonProgresses
            .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.LessonId == lessonId);

        if (progress is null)
        {
            progress = new LessonProgress
            {
                UserId = userId,
                LessonId = lessonId
            };
            db.LessonProgresses.Add(progress);
        }

        progress.WatchedSeconds = Math.Max(progress.WatchedSeconds, request.WatchedSeconds);
        progress.LastWatchedAt = DateTime.UtcNow;

        // Auto-complete if watched >= 90% of duration
        if (request.IsCompleted || (lesson.DurationSeconds.HasValue &&
            request.WatchedSeconds >= lesson.DurationSeconds.Value * 0.9))
        {
            if (!progress.IsCompleted)
            {
                progress.IsCompleted = true;
                progress.CompletedAt = DateTime.UtcNow;
            }
        }

        await db.SaveChangesAsync();

        // ── Auto-issue certificate when course reaches 100% ─────────────────
        bool certificateIssued = false;
        string? certificateCode = null;

        if (progress.IsCompleted)
        {
            // Find which course this lesson belongs to
            var courseId = await db.Lessons
                .Where(l => l.Id == lessonId)
                .Select(l => l.Module.CourseId)
                .FirstOrDefaultAsync();

            if (courseId != Guid.Empty)
            {
                // Check total lessons vs completed lessons for this user in this course
                var allLessonIds = await db.Lessons
                    .Where(l => l.Module.CourseId == courseId)
                    .Select(l => l.Id)
                    .ToListAsync();

                var completedCount = await db.LessonProgresses
                    .CountAsync(lp => lp.UserId == userId && allLessonIds.Contains(lp.LessonId) && lp.IsCompleted);

                if (completedCount >= allLessonIds.Count && allLessonIds.Count > 0)
                {
                    // Course is 100% complete — issue certificate if not already issued
                    var already = await db.Certificates
                        .FirstOrDefaultAsync(c => c.UserId == userId && c.CourseId == courseId);

                    if (already is null)
                    {
                        var user   = await db.Users.FindAsync(userId);
                        var course = await db.Courses.FindAsync(courseId);
                        if (user is not null && course is not null)
                        {
                            var cert = new Certificate
                            {
                                Code                  = Guid.NewGuid().ToString("N")[..12].ToUpper(),
                                UserId                = userId,
                                CourseId              = courseId,
                                StudentName           = user.FullName,
                                CourseName            = course.Title,
                                CourseDurationMinutes = course.DurationMinutes ?? 0,
                                IssuedAt              = DateTime.UtcNow
                            };
                            db.Certificates.Add(cert);
                            await db.SaveChangesAsync();
                            certificateIssued = true;
                            certificateCode   = cert.Code;
                        }
                    }
                    else
                    {
                        certificateCode = already.Code;
                    }
                }
            }
        }

        return Ok(new
        {
            isCompleted        = progress.IsCompleted,
            watchedSeconds     = progress.WatchedSeconds,
            certificateIssued,
            certificateCode
        });
    }

    [HttpGet("continue")]
    public async Task<ActionResult<List<ContinueWatchingDto>>> GetContinueWatching()
    {
        var userId = CurrentUserId;

        var enrolledCourseIds = await db.CourseEnrollments
            .Where(e => e.UserId == userId)
            .Select(e => e.CourseId)
            .ToListAsync();

        var result = await db.LessonProgresses
            .Where(lp => lp.UserId == userId && !lp.IsCompleted && lp.LastWatchedAt.HasValue)
            .Include(lp => lp.Lesson)
                .ThenInclude(l => l.Module)
                    .ThenInclude(m => m.Course)
            .Where(lp => enrolledCourseIds.Contains(lp.Lesson.Module.CourseId))
            .OrderByDescending(lp => lp.LastWatchedAt)
            .Take(5)
            .Select(lp => new ContinueWatchingDto(
                lp.Lesson.Module.CourseId,
                lp.Lesson.Module.Course.Title,
                lp.Lesson.Module.Course.ThumbnailUrl,
                lp.Lesson.ModuleId,
                lp.Lesson.Module.Title,
                lp.LessonId,
                lp.Lesson.Title,
                lp.WatchedSeconds,
                lp.Lesson.DurationSeconds,
                lp.LastWatchedAt!.Value
            ))
            .ToListAsync();

        return Ok(result);
    }
}
