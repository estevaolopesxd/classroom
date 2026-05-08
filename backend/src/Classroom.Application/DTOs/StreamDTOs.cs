using System.ComponentModel.DataAnnotations;

namespace Classroom.Application.DTOs;

public record CreateStreamRequest(
    [Required, MaxLength(200)] string Title,
    DateTime? ScheduledAt = null
);

/// <summary>Full DTO returned only to Admins — includes the sensitive StreamKey.</summary>
public record StreamAdminDto(
    Guid Id,
    string Title,
    string StreamKey,   // ⚠ sensitive — never return to students
    string? HlsUrl,
    string Status,
    DateTime? ScheduledAt,
    DateTime? StartedAt,
    DateTime? EndedAt,
    DateTime CreatedAt
);

/// <summary>Safe DTO returned to any authenticated user — StreamKey omitted.</summary>
public record StreamPublicDto(
    Guid Id,
    string Title,
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
