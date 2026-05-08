namespace Classroom.Application.DTOs;

public record RatingAuthorDto(Guid Id, string FullName, string? AvatarUrl);

public record RatingDto(
    Guid Id,
    Guid CourseId,
    RatingAuthorDto Author,
    int Rating,
    string? Comment,
    DateTime CreatedAt
);

public record CourseRatingSummaryDto(
    double Average,
    int Total,
    int Star5, int Star4, int Star3, int Star2, int Star1
);

public record UpsertRatingRequest(int Rating, string? Comment);

public record CategoryDto(Guid Id, string Name, string Slug, string Color, string? Icon, int Order);
public record CreateCategoryRequest(string Name, string? Color, string? Icon, int Order = 0);
public record UpdateCategoryRequest(string Name, string? Color, string? Icon, int Order);
