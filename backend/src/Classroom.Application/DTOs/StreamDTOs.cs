namespace Classroom.Application.DTOs;

public record CreateStreamRequest(string Title, DateTime? ScheduledAt = null);

public record StreamDto(
    Guid Id,
    string Title,
    string StreamKey,
    string? HlsUrl,
    string Status,
    DateTime? ScheduledAt,
    DateTime? StartedAt,
    DateTime? EndedAt,
    DateTime CreatedAt
);

public record StreamStatusDto(string Status, string? HlsUrl, int ViewerCount);

public record ThemeDto(
    Guid Id,
    string Name,
    string PrimaryColor,
    string SecondaryColor,
    string AccentColor,
    string BackgroundColor,
    string SurfaceColor,
    string TextColor,
    string FontFamily,
    string? LogoUrl,
    string? FaviconUrl,
    string PlatformName
);

public record UpdateThemeRequest(
    string? PrimaryColor,
    string? SecondaryColor,
    string? AccentColor,
    string? BackgroundColor,
    string? SurfaceColor,
    string? TextColor,
    string? FontFamily,
    string? LogoUrl,
    string? FaviconUrl,
    string? PlatformName
);

public record AdminDashboardDto(
    int TotalUsers,
    int TotalCourses,
    int TotalEnrollments,
    decimal TotalRevenue,
    List<CourseDto> RecentCourses,
    List<UserDto> RecentUsers
);
