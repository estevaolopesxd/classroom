using Classroom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/uploads")]
[Authorize(Roles = "Admin")]
public class UploadsController(MinIOStorageService storage, IConfiguration config) : ControllerBase
{
    private static readonly string[] AllowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];
    private static readonly string[] AllowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB
    private const string Bucket = "assets";

    /// <summary>
    /// Faz upload de uma imagem (logo, assinatura, patrocinador) para o MinIO
    /// e retorna a URL pública permanente.
    /// </summary>
    [HttpPost("image")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string? folder = "misc")
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Nenhum arquivo enviado." });

        if (file.Length > MaxBytes)
            return BadRequest(new { message = "Arquivo muito grande. Máximo: 5 MB." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = $"Tipo não permitido. Use: {string.Join(", ", AllowedExtensions)}" });

        var contentType = file.ContentType;
        if (!AllowedTypes.Contains(contentType))
            contentType = ext == ".svg" ? "image/svg+xml" : "image/png";

        // Gera nome único para evitar colisões
        var uniqueName = $"{folder}/{Guid.NewGuid():N}{ext}";

        using var stream = file.OpenReadStream();
        await storage.PutObjectAsync(Bucket, uniqueName, stream, contentType);

        var url = await storage.GetPublicUrl(Bucket, uniqueName);
        return Ok(new { url, key = uniqueName });
    }
}
