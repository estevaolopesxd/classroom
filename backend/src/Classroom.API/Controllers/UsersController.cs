using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var users = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => MapDto(u))
            .ToListAsync();

        var total = await db.Users.CountAsync();
        Response.Headers["X-Total-Count"] = total.ToString();
        return Ok(users);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
            return Conflict(new { message = "Email já cadastrado" });

        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
            return BadRequest(new { message = "Role inválido. Use 'Admin' ou 'Student'" });

        var user = new User
        {
            Email = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = role
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, MapDto(user));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        return user is null ? NotFound() : Ok(MapDto(user));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        if (request.FirstName is not null) user.FirstName = request.FirstName;
        if (request.LastName is not null) user.LastName = request.LastName;
        if (request.AvatarUrl is not null) user.AvatarUrl = request.AvatarUrl;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        await db.SaveChangesAsync();
        return Ok(MapDto(user));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        // Soft delete
        user.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/progress")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUserProgress(Guid id)
    {
        var enrollments = await db.CourseEnrollments
            .Where(e => e.UserId == id)
            .Include(e => e.Course)
                .ThenInclude(c => c.Modules)
                    .ThenInclude(m => m.Lessons)
            .ToListAsync();

        var lessonIds = enrollments
            .SelectMany(e => e.Course.Modules)
            .SelectMany(m => m.Lessons)
            .Select(l => l.Id)
            .ToList();

        var progresses = await db.LessonProgresses
            .Where(lp => lp.UserId == id && lessonIds.Contains(lp.LessonId))
            .ToDictionaryAsync(lp => lp.LessonId);

        var result = enrollments.Select(e =>
        {
            var allLessons = e.Course.Modules.SelectMany(m => m.Lessons).ToList();
            var completed = allLessons.Count(l => progresses.TryGetValue(l.Id, out var p) && p.IsCompleted);
            return new
            {
                courseId = e.CourseId,
                courseTitle = e.Course.Title,
                enrolledAt = e.EnrolledAt,
                totalLessons = allLessons.Count,
                completedLessons = completed,
                percentComplete = allLessons.Count > 0 ? Math.Round((double)completed / allLessons.Count * 100, 1) : 0
            };
        });

        return Ok(result);
    }

    [HttpGet("me/profile")]
    public async Task<ActionResult<UserDto>> GetMyProfile()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(userId);
        return user is null ? NotFound() : Ok(MapDto(user));
    }

    [HttpPut("me/profile")]
    public async Task<ActionResult<UserDto>> UpdateMyProfile([FromBody] UpdateUserRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        if (request.FirstName is not null) user.FirstName = request.FirstName;
        if (request.LastName is not null) user.LastName = request.LastName;
        if (request.AvatarUrl is not null) user.AvatarUrl = request.AvatarUrl;

        await db.SaveChangesAsync();
        return Ok(MapDto(user));
    }

    private static UserDto MapDto(User u) => new(
        u.Id, u.Email, u.FirstName, u.LastName, u.FullName,
        u.Role.ToString(), u.AvatarUrl, u.IsActive, u.CreatedAt
    );
}
