namespace Classroom.Application.DTOs;

public record UpdateProgressRequest(int WatchedSeconds, bool IsCompleted = false);

public record CourseProgressDto(
    Guid CourseId,
    string CourseTitle,
    int TotalLessons,
    int CompletedLessons,
    double PercentComplete,
    List<ModuleProgressDto> Modules
);

public record ModuleProgressDto(
    Guid ModuleId,
    string Title,
    int TotalLessons,
    int CompletedLessons,
    List<LessonProgressDto> Lessons
);

public record LessonProgressDto(
    Guid LessonId,
    string Title,
    bool IsCompleted,
    int WatchedSeconds,
    int? DurationSeconds,
    DateTime? LastWatchedAt
);

public record ContinueWatchingDto(
    Guid CourseId,
    string CourseTitle,
    string? CourseThumbnailUrl,
    Guid ModuleId,
    string ModuleTitle,
    Guid LessonId,
    string LessonTitle,
    int WatchedSeconds,
    int? DurationSeconds,
    DateTime LastWatchedAt
);
