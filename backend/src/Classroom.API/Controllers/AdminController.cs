using Classroom.Application.DTOs;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController(AppDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var totalUsers = await db.Users.CountAsync(u => u.Role == UserRole.Student);
        var totalCourses = await db.Courses.CountAsync();
        var totalEnrollments = await db.CourseEnrollments.CountAsync();
        var totalRevenue = await db.Purchases
            .Where(p => p.Status == PurchaseStatus.Completed)
            .SumAsync(p => (decimal?)p.Amount) ?? 0;

        var recentCourses = await db.Courses
            .Include(c => c.Modules).ThenInclude(m => m.Lessons)
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new CourseDto(
                c.Id, c.Title, c.Slug, c.Description, c.ShortDescription, c.ThumbnailUrl,
                c.Status.ToString(), c.IsForSale, c.Price, c.Currency, c.PricingType.ToString(),
                c.Level, c.DurationMinutes,
                c.Modules.Count, c.Modules.Sum(m => m.Lessons.Count),
                c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        var recentUsers = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(5)
            .Select(u => new UserDto(u.Id, u.Email, u.FirstName, u.LastName, u.FirstName + " " + u.LastName,
                u.Role.ToString(), u.AvatarUrl, u.IsActive, u.CreatedAt))
            .ToListAsync();

        return Ok(new AdminDashboardDto(totalUsers, totalCourses, totalEnrollments, totalRevenue, recentCourses, recentUsers));
    }

    [HttpGet("courses/{courseId:guid}/analytics")]
    public async Task<IActionResult> GetCourseAnalytics(Guid courseId)
    {
        var course = await db.Courses
            .Include(c => c.Modules).ThenInclude(m => m.Lessons)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course is null) return NotFound();

        var enrollments = await db.CourseEnrollments
            .Where(e => e.CourseId == courseId)
            .Include(e => e.User)
            .ToListAsync();

        var allLessonIds = course.Modules.SelectMany(m => m.Lessons).Select(l => l.Id).ToList();
        var allProgresses = await db.LessonProgresses
            .Where(lp => allLessonIds.Contains(lp.LessonId))
            .GroupBy(lp => lp.UserId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList());

        var userProgress = enrollments.Select(e =>
        {
            allProgresses.TryGetValue(e.UserId, out var progresses);
            var completed = progresses?.Count(p => p.IsCompleted) ?? 0;
            return new
            {
                userId = e.UserId,
                userName = e.User.FullName,
                userEmail = e.User.Email,
                enrolledAt = e.EnrolledAt,
                completedLessons = completed,
                totalLessons = allLessonIds.Count,
                percentComplete = allLessonIds.Count > 0
                    ? Math.Round((double)completed / allLessonIds.Count * 100, 1) : 0
            };
        });

        return Ok(new
        {
            courseId,
            courseTitle = course.Title,
            totalEnrollments = enrollments.Count,
            userProgress
        });
    }
}
