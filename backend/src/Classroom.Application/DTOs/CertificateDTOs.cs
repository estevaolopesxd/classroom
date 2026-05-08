namespace Classroom.Application.DTOs;

// ── Config ─────────────────────────────────────────────────────────────────────

public record SponsorDto(Guid Id, string Name, string LogoUrl, int Order);

public record CertificateConfigDto(
    Guid Id,
    string InstitutionName,
    string? InstitutionLogoUrl,
    string? SignatureImageUrl,
    string? SignerName,
    string? SignerTitle,
    string BodyText,
    string PrimaryColor,
    string BackgroundColor,
    string TextColor,
    string? BackgroundImageUrl,
    string? CityName,
    bool IsActive,
    List<SponsorDto> Sponsors
);

public record SaveCertificateConfigRequest(
    string InstitutionName,
    string? InstitutionLogoUrl,
    string? SignatureImageUrl,
    string? SignerName,
    string? SignerTitle,
    string? BodyText,
    string? PrimaryColor,
    string? BackgroundColor,
    string? TextColor,
    string? BackgroundImageUrl,
    string? CityName
);

public record UpsertSponsorRequest(string Name, string LogoUrl, int Order);

// ── Issued certificate ─────────────────────────────────────────────────────────

public record CertificateDto(
    Guid Id,
    string Code,
    Guid CourseId,
    string CourseName,
    string StudentName,
    int CourseDurationMinutes,
    DateTime IssuedAt
);

public record IssueCertificateRequest(Guid UserId, Guid CourseId);

public record CertificateVerifyDto(
    string Code,
    string StudentName,
    string CourseName,
    string InstitutionName,
    DateTime IssuedAt,
    int CourseDurationMinutes,
    bool IsValid
);
