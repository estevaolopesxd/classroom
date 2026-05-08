using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
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
            courseTitle = course.Title,
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

    // ── Certificate Config ─────────────────────────────────────────────────────

    [HttpGet("certificates/config")]
    public async Task<IActionResult> GetCertificateConfig()
    {
        var cfg = await db.CertificateConfigs
            .Include(c => c.Sponsors.OrderBy(s => s.Order))
            .FirstOrDefaultAsync();

        if (cfg is null) return Ok(null);

        return Ok(MapCertConfigDto(cfg));
    }

    [HttpPut("certificates/config")]
    public async Task<IActionResult> SaveCertificateConfig([FromBody] SaveCertificateConfigRequest req)
    {
        var cfg = await db.CertificateConfigs.Include(c => c.Sponsors).FirstOrDefaultAsync();

        if (cfg is null)
        {
            cfg = new CertificateConfig { IsActive = true };
            db.CertificateConfigs.Add(cfg);
        }

        cfg.InstitutionName     = req.InstitutionName;
        cfg.InstitutionLogoUrl  = req.InstitutionLogoUrl;
        cfg.SignatureImageUrl   = req.SignatureImageUrl;
        cfg.SignerName          = req.SignerName;
        cfg.SignerTitle         = req.SignerTitle;
        cfg.BodyText            = req.BodyText ?? cfg.BodyText;
        cfg.PrimaryColor        = req.PrimaryColor ?? cfg.PrimaryColor;
        cfg.BackgroundColor     = req.BackgroundColor ?? cfg.BackgroundColor;
        cfg.TextColor           = req.TextColor ?? cfg.TextColor;
        cfg.BackgroundImageUrl  = req.BackgroundImageUrl;
        cfg.CityName            = req.CityName;
        cfg.UpdatedAt           = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapCertConfigDto(cfg));
    }

    [HttpPost("certificates/config/sponsors")]
    public async Task<IActionResult> AddSponsor([FromBody] UpsertSponsorRequest req)
    {
        var cfg = await db.CertificateConfigs.FirstOrDefaultAsync();
        if (cfg is null) return BadRequest(new { message = "Salve a configuração do certificado primeiro." });

        var sponsor = new CertificateSponsor
        {
            CertificateConfigId = cfg.Id,
            Name = req.Name,
            LogoUrl = req.LogoUrl,
            Order = req.Order
        };
        db.CertificateSponsors.Add(sponsor);
        await db.SaveChangesAsync();
        return Ok(new SponsorDto(sponsor.Id, sponsor.Name, sponsor.LogoUrl, sponsor.Order));
    }

    [HttpPut("certificates/config/sponsors/{sponsorId:guid}")]
    public async Task<IActionResult> UpdateSponsor(Guid sponsorId, [FromBody] UpsertSponsorRequest req)
    {
        var sponsor = await db.CertificateSponsors.FindAsync(sponsorId);
        if (sponsor is null) return NotFound();

        sponsor.Name    = req.Name;
        sponsor.LogoUrl = req.LogoUrl;
        sponsor.Order   = req.Order;
        await db.SaveChangesAsync();
        return Ok(new SponsorDto(sponsor.Id, sponsor.Name, sponsor.LogoUrl, sponsor.Order));
    }

    [HttpDelete("certificates/config/sponsors/{sponsorId:guid}")]
    public async Task<IActionResult> DeleteSponsor(Guid sponsorId)
    {
        var sponsor = await db.CertificateSponsors.FindAsync(sponsorId);
        if (sponsor is null) return NotFound();
        db.CertificateSponsors.Remove(sponsor);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("certificates")]
    public async Task<IActionResult> GetAllCertificates([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var certs = await db.Certificates
            .OrderByDescending(c => c.IssuedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CertificateDto(
                c.Id, c.Code, c.CourseId, c.CourseName,
                c.StudentName, c.CourseDurationMinutes, c.IssuedAt))
            .ToListAsync();

        var total = await db.Certificates.CountAsync();
        Response.Headers["X-Total-Count"] = total.ToString();
        return Ok(certs);
    }

    // ── Certificate: issue manually for a user ─────────────────────────────────

    [HttpPost("certificates/issue")]
    public async Task<IActionResult> IssueCertificate([FromBody] IssueCertificateRequest req)
    {
        var user = await db.Users.FindAsync(req.UserId);
        if (user is null) return NotFound(new { message = "Usuário não encontrado" });

        var course = await db.Courses.FindAsync(req.CourseId);
        if (course is null) return NotFound(new { message = "Curso não encontrado" });

        var existing = await db.Certificates
            .AnyAsync(c => c.UserId == req.UserId && c.CourseId == req.CourseId);
        if (existing) return Conflict(new { message = "Certificado já emitido para este aluno neste curso" });

        var cert = new Certificate
        {
            Code                  = Guid.NewGuid().ToString("N")[..12].ToUpper(),
            UserId                = req.UserId,
            CourseId              = req.CourseId,
            StudentName           = user.FullName,
            CourseName            = course.Title,
            CourseDurationMinutes = course.DurationMinutes ?? 0,
            IssuedAt              = DateTime.UtcNow
        };
        db.Certificates.Add(cert);
        await db.SaveChangesAsync();
        return Ok(new CertificateDto(cert.Id, cert.Code, cert.CourseId, cert.CourseName,
            cert.StudentName, cert.CourseDurationMinutes, cert.IssuedAt));
    }

    private static CertificateConfigDto MapCertConfigDto(CertificateConfig cfg) => new(
        cfg.Id, cfg.InstitutionName, cfg.InstitutionLogoUrl,
        cfg.SignatureImageUrl, cfg.SignerName, cfg.SignerTitle,
        cfg.BodyText, cfg.PrimaryColor, cfg.BackgroundColor, cfg.TextColor,
        cfg.BackgroundImageUrl, cfg.CityName, cfg.IsActive,
        cfg.Sponsors.OrderBy(s => s.Order)
            .Select(s => new SponsorDto(s.Id, s.Name, s.LogoUrl, s.Order))
            .ToList()
    );
}
