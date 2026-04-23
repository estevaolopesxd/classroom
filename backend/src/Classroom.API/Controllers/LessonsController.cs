using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/modules/{moduleId:guid}/lessons")]
public class LessonsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<LessonDto>>> GetAll(Guid moduleId)
    {
        var lessons = await db.Lessons
            .Where(l => l.ModuleId == moduleId)
            .Include(l => l.Video)
            .OrderBy(l => l.Order)
            .ToListAsync();

        return Ok(lessons.Select(MapDto).ToList());
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LessonDto>> Create(Guid moduleId, [FromBody] CreateLessonRequest request)
    {
        var module = await db.Modules.FindAsync(moduleId);
        if (module is null) return NotFound();

        if (!Enum.TryParse<LessonType>(request.Type, true, out var lessonType))
            return BadRequest(new { message = "Tipo inválido. Use Video, Text ou LiveStream" });

        var maxOrder = await db.Lessons
            .Where(l => l.ModuleId == moduleId)
            .MaxAsync(l => (int?)l.Order) ?? 0;

        var lesson = new Lesson
        {
            ModuleId = moduleId,
            Title = request.Title,
            Description = request.Description,
            Type = lessonType,
            IsFreePreview = request.IsFreePreview,
            TextContent = request.TextContent,
            Order = maxOrder + 1
        };

        db.Lessons.Add(lesson);
        await db.SaveChangesAsync();
        return Ok(MapDto(lesson));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LessonDto>> Update(Guid moduleId, Guid id, [FromBody] UpdateLessonRequest request)
    {
        var lesson = await db.Lessons
            .Include(l => l.Video)
            .FirstOrDefaultAsync(l => l.Id == id && l.ModuleId == moduleId);

        if (lesson is null) return NotFound();

        if (request.Title is not null) lesson.Title = request.Title;
        if (request.Description is not null) lesson.Description = request.Description;
        if (request.IsFreePreview.HasValue) lesson.IsFreePreview = request.IsFreePreview.Value;
        if (request.VideoId.HasValue) lesson.VideoId = request.VideoId;
        if (request.TextContent is not null) lesson.TextContent = request.TextContent;

        await db.SaveChangesAsync();
        return Ok(MapDto(lesson));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid moduleId, Guid id)
    {
        var lesson = await db.Lessons.FirstOrDefaultAsync(l => l.Id == id && l.ModuleId == moduleId);
        if (lesson is null) return NotFound();
        db.Lessons.Remove(lesson);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reorder(Guid moduleId, [FromBody] ReorderRequest request)
    {
        var lessons = await db.Lessons
            .Where(l => l.ModuleId == moduleId && request.OrderedIds.Contains(l.Id))
            .ToListAsync();

        for (int i = 0; i < request.OrderedIds.Count; i++)
        {
            var lesson = lessons.FirstOrDefault(l => l.Id == request.OrderedIds[i]);
            if (lesson is not null) lesson.Order = i + 1;
        }

        await db.SaveChangesAsync();
        return NoContent();
    }

    private static LessonDto MapDto(Lesson l) => new(
        l.Id, l.ModuleId, l.Title, l.Description, l.Type.ToString(),
        l.Order, l.DurationSeconds, l.IsFreePreview,
        l.VideoId, l.Video?.HlsKey,
        l.Video is null ? null : new Application.DTOs.VideoStatus(l.Video.Status.ToString(), l.Video.HlsKey, l.Video.ThumbnailKey, l.Video.DurationSeconds),
        l.TextContent
    );
}
