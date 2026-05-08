using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/lessons/{lessonId:guid}/comments")]
[Authorize]
public class CommentsController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── GET ────────────────────────────────────────────────────────────────────

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetComments(Guid lessonId, [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);

        // Load top-level comments + their replies in one query
        var topLevel = await db.LessonComments
            .Where(c => c.LessonId == lessonId && c.ParentId == null && !c.IsDeleted)
            .Include(c => c.User)
            .Include(c => c.Replies.Where(r => !r.IsDeleted))
                .ThenInclude(r => r.User)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var total = await db.LessonComments
            .CountAsync(c => c.LessonId == lessonId && c.ParentId == null && !c.IsDeleted);

        Response.Headers["X-Total-Count"] = total.ToString();
        return Ok(topLevel.Select(MapDto));
    }

    // ── POST ───────────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> Create(Guid lessonId, [FromBody] CreateCommentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "Comentário não pode ser vazio." });

        if (!await db.Lessons.AnyAsync(l => l.Id == lessonId))
            return NotFound(new { message = "Aula não encontrada." });

        if (req.ParentId.HasValue)
        {
            var parent = await db.LessonComments.FindAsync(req.ParentId.Value);
            if (parent is null || parent.IsDeleted || parent.LessonId != lessonId)
                return BadRequest(new { message = "Comentário pai inválido." });
            // Allow only 1 level of nesting
            if (parent.ParentId.HasValue)
                return BadRequest(new { message = "Não é possível responder a uma resposta." });
        }

        var comment = new LessonComment
        {
            LessonId  = lessonId,
            UserId    = CurrentUserId,
            Content   = req.Content.Trim(),
            ParentId  = req.ParentId
        };
        db.LessonComments.Add(comment);
        await db.SaveChangesAsync();

        // Re-load with User for response
        await db.Entry(comment).Reference(c => c.User).LoadAsync();
        return CreatedAtAction(nameof(GetComments), new { lessonId }, MapDto(comment));
    }

    // ── PUT ────────────────────────────────────────────────────────────────────

    [HttpPut("{commentId:guid}")]
    public async Task<IActionResult> Update(Guid lessonId, Guid commentId, [FromBody] UpdateCommentRequest req)
    {
        var comment = await db.LessonComments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == commentId && c.LessonId == lessonId && !c.IsDeleted);

        if (comment is null) return NotFound();

        var isAdmin = User.IsInRole("Admin");
        if (comment.UserId != CurrentUserId && !isAdmin)
            return Forbid();

        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "Conteúdo não pode ser vazio." });

        comment.Content   = req.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(MapDto(comment));
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────

    [HttpDelete("{commentId:guid}")]
    public async Task<IActionResult> Delete(Guid lessonId, Guid commentId)
    {
        var comment = await db.LessonComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.LessonId == lessonId && !c.IsDeleted);

        if (comment is null) return NotFound();

        var isAdmin = User.IsInRole("Admin");
        if (comment.UserId != CurrentUserId && !isAdmin)
            return Forbid();

        comment.IsDeleted = true;
        comment.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Mapper ─────────────────────────────────────────────────────────────────

    private static CommentDto MapDto(LessonComment c) => new(
        c.Id, c.LessonId,
        new CommentAuthorDto(c.User.Id, c.User.FullName, c.User.AvatarUrl),
        c.Content, c.ParentId,
        c.CreatedAt, c.UpdatedAt,
        c.Replies
            .Where(r => !r.IsDeleted)
            .OrderBy(r => r.CreatedAt)
            .Select(MapDto)
            .ToList()
    );
}
