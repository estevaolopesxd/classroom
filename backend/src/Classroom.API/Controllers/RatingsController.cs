using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/courses/{courseId:guid}/ratings")]
public class RatingsController(AppDbContext db) : ControllerBase
{
    private Guid? CurrentUserId => User.Identity?.IsAuthenticated == true
        ? Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)
        : null;

    // ── GET all ratings ────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetRatings(Guid courseId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);

        var ratings = await db.CourseRatings
            .Where(r => r.CourseId == courseId)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RatingDto(
                r.Id, r.CourseId,
                new RatingAuthorDto(r.User.Id, r.User.FullName, r.User.AvatarUrl),
                r.Rating, r.Comment, r.CreatedAt))
            .ToListAsync();

        var total  = await db.CourseRatings.CountAsync(r => r.CourseId == courseId);
        var allRatings = await db.CourseRatings.Where(r => r.CourseId == courseId).Select(r => r.Rating).ToListAsync();

        var summary = new CourseRatingSummaryDto(
            Average: allRatings.Count > 0 ? Math.Round(allRatings.Average(), 1) : 0,
            Total:   total,
            Star5: allRatings.Count(x => x == 5),
            Star4: allRatings.Count(x => x == 4),
            Star3: allRatings.Count(x => x == 3),
            Star2: allRatings.Count(x => x == 2),
            Star1: allRatings.Count(x => x == 1)
        );

        Response.Headers["X-Total-Count"] = total.ToString();
        return Ok(new { summary, ratings });
    }

    // ── GET own rating ─────────────────────────────────────────────────────────

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyRating(Guid courseId)
    {
        var userId = CurrentUserId!.Value;
        var r = await db.CourseRatings
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.CourseId == courseId && r.UserId == userId);

        if (r is null) return Ok(null);
        return Ok(new RatingDto(r.Id, r.CourseId,
            new RatingAuthorDto(r.User.Id, r.User.FullName, r.User.AvatarUrl),
            r.Rating, r.Comment, r.CreatedAt));
    }

    // ── POST / PUT (upsert) ────────────────────────────────────────────────────

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Upsert(Guid courseId, [FromBody] UpsertRatingRequest req)
    {
        if (req.Rating < 1 || req.Rating > 5)
            return BadRequest(new { message = "Avaliação deve ser entre 1 e 5." });

        var userId = CurrentUserId!.Value;

        // Must be enrolled
        var enrolled = await db.CourseEnrollments
            .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);
        if (!enrolled)
            return Forbid();

        var existing = await db.CourseRatings
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.CourseId == courseId && r.UserId == userId);

        if (existing is null)
        {
            existing = new CourseRating
            {
                CourseId = courseId,
                UserId   = userId,
                Rating   = req.Rating,
                Comment  = req.Comment?.Trim()
            };
            db.CourseRatings.Add(existing);
        }
        else
        {
            existing.Rating    = req.Rating;
            existing.Comment   = req.Comment?.Trim();
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        await db.Entry(existing).Reference(r => r.User).LoadAsync();

        return Ok(new RatingDto(existing.Id, existing.CourseId,
            new RatingAuthorDto(existing.User.Id, existing.User.FullName, existing.User.AvatarUrl),
            existing.Rating, existing.Comment, existing.CreatedAt));
    }

    // ── DELETE own rating ──────────────────────────────────────────────────────

    [HttpDelete("my")]
    [Authorize]
    public async Task<IActionResult> DeleteMyRating(Guid courseId)
    {
        var userId = CurrentUserId!.Value;
        var r = await db.CourseRatings
            .FirstOrDefaultAsync(r => r.CourseId == courseId && r.UserId == userId);

        if (r is null) return NotFound();
        db.CourseRatings.Remove(r);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
