using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/theme")]
public class ThemeController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ThemeDto>> GetActive()
    {
        var theme = await db.ThemeConfigs.FirstOrDefaultAsync(t => t.IsActive)
            ?? await db.ThemeConfigs.FirstOrDefaultAsync()
            ?? DefaultTheme();
        return Ok(MapDto(theme));
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ThemeDto>> Update([FromBody] UpdateThemeRequest request)
    {
        var theme = await db.ThemeConfigs.FirstOrDefaultAsync(t => t.IsActive);
        if (theme is null)
        {
            theme = new ThemeConfig { IsActive = true };
            db.ThemeConfigs.Add(theme);
        }

        if (request.PrimaryColor is not null) theme.PrimaryColor = request.PrimaryColor;
        if (request.SecondaryColor is not null) theme.SecondaryColor = request.SecondaryColor;
        if (request.AccentColor is not null) theme.AccentColor = request.AccentColor;
        if (request.BackgroundColor is not null) theme.BackgroundColor = request.BackgroundColor;
        if (request.SurfaceColor is not null) theme.SurfaceColor = request.SurfaceColor;
        if (request.TextColor is not null) theme.TextColor = request.TextColor;
        if (request.FontFamily is not null) theme.FontFamily = request.FontFamily;
        if (request.LogoUrl is not null) theme.LogoUrl = request.LogoUrl;
        if (request.FaviconUrl is not null) theme.FaviconUrl = request.FaviconUrl;
        if (request.PlatformName is not null) theme.PlatformName = request.PlatformName;
        theme.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapDto(theme));
    }

    private static ThemeConfig DefaultTheme() => new()
    {
        PrimaryColor = "#8B5CF6",
        SecondaryColor = "#F59E0B",
        AccentColor = "#EC4899",
        BackgroundColor = "#0F0F0F",
        SurfaceColor = "#1A1A1A",
        TextColor = "#F9FAFB",
        FontFamily = "Inter",
        PlatformName = "Classroom"
    };

    private static ThemeDto MapDto(ThemeConfig t) => new(
        t.Id, t.Name, t.PrimaryColor, t.SecondaryColor, t.AccentColor,
        t.BackgroundColor, t.SurfaceColor, t.TextColor, t.FontFamily,
        t.LogoUrl, t.FaviconUrl, t.PlatformName
    );
}
