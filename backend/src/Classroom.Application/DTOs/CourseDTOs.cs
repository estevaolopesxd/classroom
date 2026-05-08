namespace Classroom.Application.DTOs;

public record CourseDto(
    Guid Id,
    string Title,
    string Slug,
    string? Description,
    string? ShortDescription,
    string? ThumbnailUrl,
    string Status,
    bool IsForSale,
    decimal? Price,
    string Currency,
    string PricingType,
    string? Level,
    int? DurationMinutes,
    int TotalModules,
    int TotalLessons,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    // Category & tags
    Guid? CategoryId = null,
    string? CategoryName = null,
    string? CategoryColor = null,
    string? Tags = null,
    // Rating
    double AverageRating = 0,
    int TotalRatings = 0
);

public record CourseDetailDto(
    Guid Id,
    string Title,
    string Slug,
    string? Description,
    string? ShortDescription,
    string? ThumbnailUrl,
    string Status,
    bool IsForSale,
    decimal? Price,
    string Currency,
    string PricingType,
    string? Level,
    int? DurationMinutes,
    List<ModuleDto> Modules,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid? CategoryId = null,
    string? CategoryName = null,
    string? CategoryColor = null,
    string? Tags = null,
    double AverageRating = 0,
    int TotalRatings = 0
);

public record CreateCourseRequest(
    string Title,
    string? Description,
    string? ShortDescription,
    string? Level,
    decimal? Price,
    string Currency = "BRL"
);

public record UpdateCourseRequest(
    string? Title,
    string? Description,
    string? ShortDescription,
    string? ThumbnailUrl,
    string? Level,
    int? DurationMinutes,
    Guid? CategoryId = null,
    string? Tags = null
);

public record UpdateSaleSettingsRequest(
    bool IsForSale,
    decimal? Price,
    string Currency = "BRL",
    string PricingType = "OneTime"
);

public record ModuleDto(
    Guid Id,
    Guid CourseId,
    string Title,
    string? Description,
    int Order,
    bool IsIntro,
    int TotalLessons,
    List<LessonDto> Lessons
);

public record CreateModuleRequest(
    string Title,
    string? Description,
    bool IsIntro = false
);

public record UpdateModuleRequest(
    string? Title,
    string? Description,
    bool? IsIntro
);

public record ReorderRequest(List<Guid> OrderedIds);

public record LessonDto(
    Guid Id,
    Guid ModuleId,
    string Title,
    string? Description,
    string Type,
    int Order,
    int? DurationSeconds,
    bool IsFreePreview,
    Guid? VideoId,
    string? VideoHlsKey,
    VideoStatus? VideoStatus,
    string? TextContent
);

public record VideoStatus(string Status, string? HlsKey, string? ThumbnailKey, int? DurationSeconds);

public record CreateLessonRequest(
    string Title,
    string? Description,
    string Type = "Video",
    bool IsFreePreview = false,
    string? TextContent = null
);

public record UpdateLessonRequest(
    string? Title,
    string? Description,
    bool? IsFreePreview,
    Guid? VideoId,
    string? TextContent
);
