using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/courses/{courseId:guid}/modules")]
public class ModulesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ModuleDto>>> GetAll(Guid courseId)
    {
        var modules = await db.Modules
            .Where(m => m.CourseId == courseId)
            .Include(m => m.Lessons.OrderBy(l => l.Order))
                .ThenInclude(l => l.Video)
            .OrderBy(m => m.Order)
            .ToListAsync();

        return Ok(modules.Select(MapDto).ToList());
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ModuleDto>> Create(Guid courseId, [FromBody] CreateModuleRequest request)
    {
        var course = await db.Courses.FindAsync(courseId);
        if (course is null) return NotFound();

        var maxOrder = await db.Modules
            .Where(m => m.CourseId == courseId)
            .MaxAsync(m => (int?)m.Order) ?? 0;

        var module = new Module
        {
            CourseId = courseId,
            Title = request.Title,
            Description = request.Description,
            IsIntro = request.IsIntro,
            Order = maxOrder + 1
        };

        db.Modules.Add(module);
        await db.SaveChangesAsync();
        return CreatedAtAction(null, null, MapDto(module));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ModuleDto>> Update(Guid courseId, Guid id, [FromBody] UpdateModuleRequest request)
    {
        var module = await db.Modules
            .Include(m => m.Lessons.OrderBy(l => l.Order))
            .FirstOrDefaultAsync(m => m.Id == id && m.CourseId == courseId);

        if (module is null) return NotFound();

        if (request.Title is not null) module.Title = request.Title;
        if (request.Description is not null) module.Description = request.Description;
        if (request.IsIntro.HasValue) module.IsIntro = request.IsIntro.Value;

        await db.SaveChangesAsync();
        return Ok(MapDto(module));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid courseId, Guid id)
    {
        var module = await db.Modules.FirstOrDefaultAsync(m => m.Id == id && m.CourseId == courseId);
        if (module is null) return NotFound();
        db.Modules.Remove(module);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reorder(Guid courseId, [FromBody] ReorderRequest request)
    {
        var modules = await db.Modules
            .Where(m => m.CourseId == courseId && request.OrderedIds.Contains(m.Id))
            .ToListAsync();

        for (int i = 0; i < request.OrderedIds.Count; i++)
        {
            var module = modules.FirstOrDefault(m => m.Id == request.OrderedIds[i]);
            if (module is not null) module.Order = i + 1;
        }

        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ModuleDto MapDto(Module m) => new(
        m.Id, m.CourseId, m.Title, m.Description, m.Order, m.IsIntro,
        m.Lessons.Count,
        m.Lessons.OrderBy(l => l.Order).Select(l => new LessonDto(
            l.Id, l.ModuleId, l.Title, l.Description, l.Type.ToString(),
            l.Order, l.DurationSeconds, l.IsFreePreview,
            l.VideoId, l.Video?.HlsKey,
            l.Video is null ? null : new Application.DTOs.VideoStatus(l.Video.Status.ToString(), l.Video.HlsKey, l.Video.ThumbnailKey, l.Video.DurationSeconds),
            l.TextContent
        )).ToList()
    );
}
