using System.Security.Claims;
using System.Text.RegularExpressions;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Classroom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/courses")]
public class CoursesController(AppDbContext db, StripeService stripe) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<CourseDto>>> GetAll([FromQuery] bool? published, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var isAdmin = User.IsInRole("Admin");
        var query = db.Courses.AsQueryable();

        if (!isAdmin)
            query = query.Where(c => c.Status == CourseStatus.Published);
        else if (published.HasValue)
            query = query.Where(c => published.Value ? c.Status == CourseStatus.Published : c.Status != CourseStatus.Published);

        var courses = await query
            .Include(c => c.Modules).ThenInclude(m => m.Lessons)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => MapDto(c))
            .ToListAsync();

        var total = await query.CountAsync();
        Response.Headers["X-Total-Count"] = total.ToString();
        return Ok(courses);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<List<CourseDto>>> GetMyCourses()
    {
        var userId = CurrentUserId;
        var courses = await db.CourseEnrollments
            .Where(e => e.UserId == userId)
            .Include(e => e.Course).ThenInclude(c => c.Modules).ThenInclude(m => m.Lessons)
            .Select(e => MapDto(e.Course))
            .ToListAsync();
        return Ok(courses);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourseDetailDto>> GetById(Guid id)
    {
        var isAdmin = User.IsInRole("Admin");
        var course = await db.Courses
            .Include(c => c.Modules.OrderBy(m => m.Order))
                .ThenInclude(m => m.Lessons.OrderBy(l => l.Order))
                    .ThenInclude(l => l.Video)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (course is null) return NotFound();
        if (!isAdmin && course.Status != CourseStatus.Published)
            return NotFound();

        return Ok(MapDetailDto(course));
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<CourseDetailDto>> GetBySlug(string slug)
    {
        var isAdmin = User.IsInRole("Admin");
        var course = await db.Courses
            .Include(c => c.Modules.OrderBy(m => m.Order))
                .ThenInclude(m => m.Lessons.OrderBy(l => l.Order))
                    .ThenInclude(l => l.Video)
            .FirstOrDefaultAsync(c => c.Slug == slug);

        if (course is null) return NotFound();
        if (!isAdmin && course.Status != CourseStatus.Published)
            return NotFound();

        return Ok(MapDetailDto(course));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CourseDto>> Create([FromBody] CreateCourseRequest request)
    {
        var slug = GenerateSlug(request.Title);
        var counter = 0;
        while (await db.Courses.AnyAsync(c => c.Slug == slug))
            slug = $"{GenerateSlug(request.Title)}-{++counter}";

        var course = new Course
        {
            Title = request.Title,
            Slug = slug,
            Description = request.Description,
            ShortDescription = request.ShortDescription,
            Level = request.Level,
            Price = request.Price,
            Currency = request.Currency,
            CreatedById = CurrentUserId
        };

        db.Courses.Add(course);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = course.Id }, MapDto(course));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CourseDto>> Update(Guid id, [FromBody] UpdateCourseRequest request)
    {
        var course = await db.Courses.FindAsync(id);
        if (course is null) return NotFound();

        if (request.Title is not null) course.Title = request.Title;
        if (request.Description is not null) course.Description = request.Description;
        if (request.ShortDescription is not null) course.ShortDescription = request.ShortDescription;
        if (request.ThumbnailUrl is not null) course.ThumbnailUrl = request.ThumbnailUrl;
        if (request.Level is not null) course.Level = request.Level;
        if (request.DurationMinutes.HasValue) course.DurationMinutes = request.DurationMinutes;

        await db.SaveChangesAsync();
        return Ok(MapDto(course));
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CourseDto>> Publish(Guid id)
    {
        var course = await db.Courses.FindAsync(id);
        if (course is null) return NotFound();
        course.Status = CourseStatus.Published;
        await db.SaveChangesAsync();
        return Ok(MapDto(course));
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CourseDto>> Archive(Guid id)
    {
        var course = await db.Courses.FindAsync(id);
        if (course is null) return NotFound();
        course.Status = CourseStatus.Archived;
        await db.SaveChangesAsync();
        return Ok(MapDto(course));
    }

    [HttpPatch("{id:guid}/sale-settings")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CourseDto>> UpdateSaleSettings(Guid id, [FromBody] UpdateSaleSettingsRequest request)
    {
        var course = await db.Courses.FindAsync(id);
        if (course is null) return NotFound();

        course.IsForSale = request.IsForSale;
        course.Price = request.Price;
        course.Currency = request.Currency;

        if (request.IsForSale && request.Price.HasValue)
        {
            // Create or update Stripe product/price
            if (string.IsNullOrEmpty(course.StripeProductId))
            {
                var product = await stripe.CreateProductAsync(course.Title, course.Description ?? course.Title);
                course.StripeProductId = product.Id;
            }

            var price = await stripe.CreatePriceAsync(course.StripeProductId, request.Price.Value, request.Currency);
            course.StripePriceId = price.Id;
        }

        await db.SaveChangesAsync();
        return Ok(MapDto(course));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var course = await db.Courses.FindAsync(id);
        if (course is null) return NotFound();
        db.Courses.Remove(course);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/progress")]
    [Authorize]
    public async Task<IActionResult> GetProgress(Guid id)
    {
        var userId = CurrentUserId;
        var isEnrolled = await db.CourseEnrollments.AnyAsync(e => e.UserId == userId && e.CourseId == id);
        if (!isEnrolled) return Forbid();

        var course = await db.Courses
            .Include(c => c.Modules.OrderBy(m => m.Order))
                .ThenInclude(m => m.Lessons.OrderBy(l => l.Order))
            .FirstOrDefaultAsync(c => c.Id == id);

        if (course is null) return NotFound();

        var allLessonIds = course.Modules.SelectMany(m => m.Lessons).Select(l => l.Id).ToList();
        var progresses = await db.LessonProgresses
            .Where(lp => lp.UserId == userId && allLessonIds.Contains(lp.LessonId))
            .ToDictionaryAsync(lp => lp.LessonId);

        var totalLessons = allLessonIds.Count;
        var completedLessons = progresses.Values.Count(p => p.IsCompleted);

        return Ok(new CourseProgressDto(
            course.Id, course.Title, totalLessons, completedLessons,
            totalLessons > 0 ? Math.Round((double)completedLessons / totalLessons * 100, 1) : 0,
            course.Modules.Select(m =>
            {
                var mLessons = m.Lessons.ToList();
                var mCompleted = mLessons.Count(l => progresses.TryGetValue(l.Id, out var p) && p.IsCompleted);
                return new ModuleProgressDto(m.Id, m.Title, mLessons.Count, mCompleted,
                    mLessons.Select(l =>
                    {
                        progresses.TryGetValue(l.Id, out var p);
                        return new LessonProgressDto(l.Id, l.Title, p?.IsCompleted ?? false,
                            p?.WatchedSeconds ?? 0, l.DurationSeconds, p?.LastWatchedAt);
                    }).ToList());
            }).ToList()
        ));
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLower();
        slug = Regex.Replace(slug, @"[áàãâä]", "a");
        slug = Regex.Replace(slug, @"[éèêë]", "e");
        slug = Regex.Replace(slug, @"[íìîï]", "i");
        slug = Regex.Replace(slug, @"[óòõôö]", "o");
        slug = Regex.Replace(slug, @"[úùûü]", "u");
        slug = Regex.Replace(slug, @"[ç]", "c");
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');
        return slug;
    }

    private static CourseDto MapDto(Course c) => new(
        c.Id, c.Title, c.Slug, c.Description, c.ShortDescription, c.ThumbnailUrl,
        c.Status.ToString(), c.IsForSale, c.Price, c.Currency, c.Level, c.DurationMinutes,
        c.Modules.Count, c.Modules.Sum(m => m.Lessons.Count),
        c.CreatedAt, c.UpdatedAt
    );

    private static CourseDetailDto MapDetailDto(Course c) => new(
        c.Id, c.Title, c.Slug, c.Description, c.ShortDescription, c.ThumbnailUrl,
        c.Status.ToString(), c.IsForSale, c.Price, c.Currency, c.Level, c.DurationMinutes,
        c.Modules.OrderBy(m => m.Order).Select(m => new ModuleDto(
            m.Id, m.CourseId, m.Title, m.Description, m.Order, m.IsIntro,
            m.Lessons.Count,
            m.Lessons.OrderBy(l => l.Order).Select(l => new LessonDto(
                l.Id, l.ModuleId, l.Title, l.Description, l.Type.ToString(),
                l.Order, l.DurationSeconds, l.IsFreePreview,
                l.VideoId,
                l.Video?.HlsKey,
                l.Video is null ? null : new Application.DTOs.VideoStatus(l.Video.Status.ToString(), l.Video.HlsKey, l.Video.ThumbnailKey, l.Video.DurationSeconds),
                l.TextContent
            )).ToList()
        )).ToList(),
        c.CreatedAt, c.UpdatedAt
    );
}
