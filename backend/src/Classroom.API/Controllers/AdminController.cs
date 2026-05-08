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
            .Include(c => c.Modules.OrderBy(m => m.Order))
                .ThenInclude(m => m.Lessons.OrderBy(l => l.Order))
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course is null) return NotFound();

        var allLessons = course.Modules
            .SelectMany(m => m.Lessons.Select(l => new { l.Id, l.Title, ModuleTitle = m.Title, l.Order, ModuleOrder = m.Order }))
            .OrderBy(x => x.ModuleOrder).ThenBy(x => x.Order)
            .ToList();
        var allLessonIds = allLessons.Select(l => l.Id).ToList();
        var totalLessons = allLessonIds.Count;

        // ── Enrollments ────────────────────────────────────────────────────
        var enrollments = await db.CourseEnrollments
            .Where(e => e.CourseId == courseId)
            .Include(e => e.User)
            .ToListAsync();

        var totalEnrolled = enrollments.Count;

        // ── Progress per enrolled user ──────────────────────────────────────
        var allProgresses = await db.LessonProgresses
            .Where(lp => allLessonIds.Contains(lp.LessonId))
            .ToListAsync();

        var progressByUser = allProgresses
            .GroupBy(lp => lp.UserId)
            .ToDictionary(g => g.Key, g => g.ToList());

        int notStarted = 0, inProgress = 0, completed = 0;
        foreach (var e in enrollments)
        {
            progressByUser.TryGetValue(e.UserId, out var ups);
            var done = ups?.Count(p => p.IsCompleted) ?? 0;
            if (done == 0) notStarted++;
            else if (totalLessons > 0 && done >= totalLessons) completed++;
            else inProgress++;
        }

        var completionRate = totalEnrolled > 0
            ? Math.Round((double)completed / totalEnrolled * 100, 1)
            : 0.0;

        var avgProgress = totalEnrolled > 0 && totalLessons > 0
            ? Math.Round(
                enrollments.Average(e =>
                {
                    progressByUser.TryGetValue(e.UserId, out var ups);
                    return (double)(ups?.Count(p => p.IsCompleted) ?? 0) / totalLessons * 100;
                }), 1)
            : 0.0;

        // ── Revenue & purchase funnel ───────────────────────────────────────
        var purchases = await db.Purchases
            .Where(p => p.CourseId == courseId)
            .ToListAsync();

        var abandonThreshold = DateTime.UtcNow.AddHours(-1);
        var completedPurchases = purchases.Count(p => p.Status == PurchaseStatus.Completed);
        var pendingAbandoned   = purchases.Count(p => p.Status == PurchaseStatus.Pending && p.CreatedAt < abandonThreshold);
        var refundedCount      = purchases.Count(p => p.Status == PurchaseStatus.Refunded);
        var totalRevenue       = purchases
            .Where(p => p.Status == PurchaseStatus.Completed)
            .Sum(p => p.Amount);
        var activeSubscriptions = enrollments.Count(e => e.SubscriptionStatus == SubscriptionStatus.Active);

        // Conversion: started checkout → completed
        var checkoutConvRate = (completedPurchases + pendingAbandoned) > 0
            ? Math.Round((double)completedPurchases / (completedPurchases + pendingAbandoned) * 100, 1)
            : 0.0;

        // ── Enrollment source split ─────────────────────────────────────────
        var bySource = new
        {
            purchase = enrollments.Count(e => e.Source == EnrollmentSource.Purchase),
            free     = enrollments.Count(e => e.Source == EnrollmentSource.Free),
            admin    = enrollments.Count(e => e.Source == EnrollmentSource.Admin)
        };

        // ── Per-lesson completion ───────────────────────────────────────────
        var lessonCompletionByLesson = allProgresses
            .Where(lp => lp.IsCompleted)
            .GroupBy(lp => lp.LessonId)
            .ToDictionary(g => g.Key, g => g.Count());

        var perLesson = allLessons.Select(l => new
        {
            lessonId        = l.Id,
            title           = l.Title,
            moduleTitle     = l.ModuleTitle,
            completedCount  = lessonCompletionByLesson.TryGetValue(l.Id, out var cnt) ? cnt : 0,
            completionRate  = totalEnrolled > 0
                ? Math.Round((double)(lessonCompletionByLesson.TryGetValue(l.Id, out var cnt2) ? cnt2 : 0) / totalEnrolled * 100, 1)
                : 0.0
        }).ToList();

        // ── Enrollments over last 30 days ───────────────────────────────────
        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-29);
        var enrollmentsByDay = enrollments
            .Where(e => e.EnrolledAt >= thirtyDaysAgo)
            .GroupBy(e => e.EnrolledAt.Date)
            .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), count = g.Count() })
            .OrderBy(x => x.date)
            .ToList();

        // ── Student list ────────────────────────────────────────────────────
        var lastActivityByUser = allProgresses
            .GroupBy(lp => lp.UserId)
            .ToDictionary(g => g.Key, g => g.Max(p => p.LastWatchedAt));

        var students = enrollments.Select(e =>
        {
            progressByUser.TryGetValue(e.UserId, out var ups);
            var done = ups?.Count(p => p.IsCompleted) ?? 0;
            lastActivityByUser.TryGetValue(e.UserId, out var lastActivity);
            return new
            {
                userId           = e.UserId,
                name             = e.User.FullName,
                email            = e.User.Email,
                source           = e.Source.ToString(),
                subscriptionStatus = e.SubscriptionStatus.ToString(),
                enrolledAt       = e.EnrolledAt,
                lastActivity,
                completedLessons = done,
                totalLessons,
                progressPercent  = totalLessons > 0
                    ? Math.Round((double)done / totalLessons * 100, 1)
                    : 0.0
            };
        })
        .OrderByDescending(s => s.progressPercent)
        .ToList();

        return Ok(new
        {
            courseId,
            courseTitle        = course.Title,
            thumbnailUrl       = course.ThumbnailUrl,
            isForSale          = course.IsForSale,
            price              = course.Price,
            currency           = course.Currency,
            pricingType        = course.PricingType.ToString(),

            // Overview
            totalEnrolled,
            notStarted,
            inProgress,
            completed,
            completionRate,
            avgProgress,

            // Revenue
            totalRevenue,
            completedPurchases,
            pendingAbandoned,
            refundedCount,
            activeSubscriptions,
            checkoutConvRate,

            // Split
            bySource,

            // Per-lesson
            perLesson,

            // Timeline
            enrollmentsByDay,

            // Students
            students
        });
    }
}
