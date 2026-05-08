namespace Classroom.Domain.Entities;

public class CertificateConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Instituição
    public string InstitutionName { get; set; } = string.Empty;
    public string? InstitutionLogoUrl { get; set; }

    // Assinatura
    public string? SignatureImageUrl { get; set; }
    public string? SignerName { get; set; }
    public string? SignerTitle { get; set; }

    // Texto do certificado (suporta {{studentName}}, {{courseName}}, {{hours}}, {{date}})
    public string BodyText { get; set; } =
        "Certificamos que {{studentName}} concluiu com êxito o curso {{courseName}}, com carga horária de {{hours}} horas.";

    // Visual
    public string PrimaryColor { get; set; } = "#C4267A";
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string TextColor { get; set; } = "#1A0A12";
    public string? BackgroundImageUrl { get; set; }

    // Localização
    public string? CityName { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CertificateSponsor> Sponsors { get; set; } = new List<CertificateSponsor>();
}
