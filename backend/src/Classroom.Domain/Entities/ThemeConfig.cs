namespace Classroom.Domain.Entities;

public class ThemeConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "default";
    public string PrimaryColor { get; set; } = "#8B5CF6";
    public string SecondaryColor { get; set; } = "#F59E0B";
    public string AccentColor { get; set; } = "#EC4899";
    public string BackgroundColor { get; set; } = "#0F0F0F";
    public string SurfaceColor { get; set; } = "#1A1A1A";
    public string TextColor { get; set; } = "#F9FAFB";
    public string FontFamily { get; set; } = "Inter";
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public string PlatformName { get; set; } = "Classroom";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
