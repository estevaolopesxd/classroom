using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Infrastructure.Data;
using Classroom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/certificates")]
public class CertificatesController(AppDbContext db, CertificatePdfService pdfService, IConfiguration config) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Lista os certificados do aluno autenticado.</summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<List<CertificateDto>>> GetMyCertificates()
    {
        var userId = CurrentUserId;
        var certs = await db.Certificates
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.IssuedAt)
            .Select(c => new CertificateDto(
                c.Id, c.Code, c.CourseId, c.CourseName,
                c.StudentName, c.CourseDurationMinutes, c.IssuedAt))
            .ToListAsync();

        return Ok(certs);
    }

    /// <summary>Faz download do PDF do certificado pelo código.</summary>
    [HttpGet("{code}/download")]
    public async Task<IActionResult> DownloadPdf(string code)
    {
        var cert = await db.Certificates
            .Include(c => c.User)
            .Include(c => c.Course)
            .FirstOrDefaultAsync(c => c.Code == code);

        if (cert is null) return NotFound(new { message = "Certificado não encontrado" });

        // Se autenticado, só permite baixar o próprio certificado
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is not null)
        {
            var userId = Guid.Parse(userIdClaim);
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && cert.UserId != userId)
                return Forbid();
        }

        var certConfig = await db.CertificateConfigs
            .Include(cc => cc.Sponsors)
            .Where(cc => cc.IsActive)
            .FirstOrDefaultAsync();

        if (certConfig is null)
            return BadRequest(new { message = "Configuração de certificado não encontrada. Configure em Admin > Certificados." });

        var baseUrl = config["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var pdfBytes = pdfService.Generate(cert, certConfig, baseUrl);

        var fileName = $"certificado-{cert.StudentName.Replace(" ", "-").ToLower()}-{cert.CourseName.Replace(" ", "-").ToLower()}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    /// <summary>Verifica um certificado publicamente pelo código.</summary>
    [HttpGet("verify/{code}")]
    public async Task<ActionResult<CertificateVerifyDto>> Verify(string code)
    {
        var cert = await db.Certificates
            .FirstOrDefaultAsync(c => c.Code == code);

        if (cert is null)
            return Ok(new CertificateVerifyDto(code, "", "", "", DateTime.MinValue, 0, false));

        var certConfig = await db.CertificateConfigs
            .Where(cc => cc.IsActive)
            .FirstOrDefaultAsync();

        return Ok(new CertificateVerifyDto(
            cert.Code,
            cert.StudentName,
            cert.CourseName,
            certConfig?.InstitutionName ?? "",
            cert.IssuedAt,
            cert.CourseDurationMinutes,
            true
        ));
    }
}
