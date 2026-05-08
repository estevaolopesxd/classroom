namespace Classroom.Application.DTOs;

public record CommentAuthorDto(Guid Id, string FullName, string? AvatarUrl);

public record CommentDto(
    Guid Id,
    Guid LessonId,
    CommentAuthorDto Author,
    string Content,
    Guid? ParentId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<CommentDto> Replies
);

public record CreateCommentRequest(string Content, Guid? ParentId = null);
public record UpdateCommentRequest(string Content);
