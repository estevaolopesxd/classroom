using System.Text.RegularExpressions;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController(AppDbContext db) : ControllerBase
{
    // ── Public ─────────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var cats = await db.Categories
            .OrderBy(c => c.Order).ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.Color, c.Icon, c.Order))
            .ToListAsync();
        return Ok(cats);
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Nome é obrigatório." });

        var slug = Slugify(req.Name);
        if (await db.Categories.AnyAsync(c => c.Slug == slug))
            return Conflict(new { message = "Já existe uma categoria com esse nome." });

        var cat = new Category
        {
            Name  = req.Name.Trim(),
            Slug  = slug,
            Color = req.Color ?? "#C4267A",
            Icon  = req.Icon,
            Order = req.Order
        };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new CategoryDto(cat.Id, cat.Name, cat.Slug, cat.Color, cat.Icon, cat.Order));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest req)
    {
        var cat = await db.Categories.FindAsync(id);
        if (cat is null) return NotFound();

        cat.Name  = req.Name.Trim();
        cat.Slug  = Slugify(req.Name);
        cat.Color = req.Color ?? cat.Color;
        cat.Icon  = req.Icon;
        cat.Order = req.Order;
        await db.SaveChangesAsync();
        return Ok(new CategoryDto(cat.Id, cat.Name, cat.Slug, cat.Color, cat.Icon, cat.Order));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var cat = await db.Categories.FindAsync(id);
        if (cat is null) return NotFound();

        // Unlink courses before deleting
        await db.Courses.Where(c => c.CategoryId == id)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.CategoryId, (Guid?)null));

        db.Categories.Remove(cat);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string Slugify(string name) =>
        Regex.Replace(name.ToLowerInvariant().Trim()
            .Replace(" ", "-")
            .Replace("ã", "a").Replace("â", "a").Replace("á", "a").Replace("à", "a")
            .Replace("ê", "e").Replace("é", "e").Replace("è", "e")
            .Replace("í", "i").Replace("î", "i")
            .Replace("õ", "o").Replace("ô", "o").Replace("ó", "o")
            .Replace("ú", "u").Replace("û", "u")
            .Replace("ç", "c"),
            @"[^a-z0-9\-]", "");
}
