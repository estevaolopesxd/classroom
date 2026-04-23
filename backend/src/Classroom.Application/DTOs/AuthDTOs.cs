namespace Classroom.Application.DTOs;

public record LoginRequest(string Email, string Password);

public record TokenResponse(
    string AccessToken,
    int ExpiresIn,
    UserDto User
);

public record UserDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    string Role,
    string? AvatarUrl,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateUserRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Role
);

public record UpdateUserRequest(
    string? FirstName,
    string? LastName,
    string? AvatarUrl,
    bool? IsActive
);
