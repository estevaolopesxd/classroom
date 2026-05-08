namespace Classroom.Domain.Entities;

public class CertificateSponsor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CertificateConfigId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public int Order { get; set; }

    public CertificateConfig CertificateConfig { get; set; } = null!;
}
