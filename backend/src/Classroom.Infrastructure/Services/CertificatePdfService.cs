using Classroom.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Classroom.Infrastructure.Services;

public class CertificatePdfService
{
    public byte[] Generate(Certificate cert, CertificateConfig config, string verifyBaseUrl)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var hours = cert.CourseDurationMinutes > 0
            ? Math.Ceiling(cert.CourseDurationMinutes / 60.0).ToString("0")
            : "0";

        var body = config.BodyText
            .Replace("{{studentName}}", cert.StudentName)
            .Replace("{{courseName}}", cert.CourseName)
            .Replace("{{hours}}", hours)
            .Replace("{{date}}", cert.IssuedAt.ToString("dd 'de' MMMM 'de' yyyy",
                new System.Globalization.CultureInfo("pt-BR")));

        var primaryHex = config.PrimaryColor;
        var primaryColor = ParseColor(primaryHex);
        var textColor   = ParseColor(config.TextColor);
        var bgColor     = ParseColor(config.BackgroundColor);

        var verifyUrl = $"{verifyBaseUrl}/verify/{cert.Code}";
        var dateLocation = config.CityName is { Length: > 0 }
            ? $"{config.CityName}, {cert.IssuedAt:dd/MM/yyyy}"
            : cert.IssuedAt.ToString("dd/MM/yyyy");

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(0);
                page.DefaultTextStyle(t => t.FontFamily("Arial").FontColor(Colors.Black));

                page.Content().Element(c => BuildContent(
                    c, cert, config, body, primaryColor, textColor, bgColor,
                    dateLocation, verifyUrl, hours));
            });
        }).GeneratePdf();
    }

    private static void BuildContent(
        IContainer root,
        Certificate cert,
        CertificateConfig config,
        string body,
        string primaryColor,
        string textColor,
        string bgColor,
        string dateLocation,
        string verifyUrl,
        string hours)
    {
        root.Background(bgColor).Padding(0).Column(col =>
        {
            // ── Top accent bar ──────────────────────────────────────────────
            col.Item().Height(12).Background(primaryColor);

            // ── Main body ────────────────────────────────────────────────────
            col.Item().Padding(50).Column(main =>
            {
                // Header row: logo left + title right
                main.Item().Row(row =>
                {
                    // Institution logo
                    row.RelativeItem().Column(logo =>
                    {
                        if (config.InstitutionLogoUrl is { Length: > 0 })
                        {
                            try
                            {
                                using var http = new System.Net.Http.HttpClient();
                                var bytes = http.GetByteArrayAsync(config.InstitutionLogoUrl).GetAwaiter().GetResult();
                                logo.Item().MaxHeight(70).MaxWidth(200).Image(bytes).FitArea();
                            }
                            catch { /* logo não carregou — omite silenciosamente */ }
                        }
                        logo.Item().PaddingTop(6)
                            .Text(config.InstitutionName)
                            .FontSize(13).SemiBold().FontColor(primaryColor);
                    });

                    // Certificate title block
                    row.ConstantItem(260).AlignRight().Column(title =>
                    {
                        title.Item()
                            .Text("CERTIFICADO DE CONCLUSÃO")
                            .FontSize(11).LetterSpacing(0.12f).Bold()
                            .FontColor(primaryColor);
                        title.Item().Height(3).Background(primaryColor);
                    });
                });

                main.Item().PaddingTop(36).Text("Certificamos que")
                    .FontSize(14).FontColor(textColor);

                main.Item().PaddingTop(8)
                    .Text(cert.StudentName)
                    .FontSize(32).Bold().FontColor(primaryColor);

                main.Item().PaddingTop(4).Height(2).Background(primaryColor);

                main.Item().PaddingTop(18)
                    .Text(body)
                    .FontSize(13).FontColor(textColor).LineHeight(1.5f);

                main.Item().PaddingTop(30).Row(sigRow =>
                {
                    // Signature block
                    sigRow.RelativeItem().Column(sig =>
                    {
                        if (config.SignatureImageUrl is { Length: > 0 })
                        {
                            try
                            {
                                using var http = new System.Net.Http.HttpClient();
                                var bytes = http.GetByteArrayAsync(config.SignatureImageUrl).GetAwaiter().GetResult();
                                sig.Item().MaxHeight(60).MaxWidth(180).Image(bytes).FitArea();
                            }
                            catch { }
                        }
                        sig.Item().Height(1).Background(textColor).MaxWidth(200);
                        if (config.SignerName is { Length: > 0 })
                            sig.Item().PaddingTop(4).Text(config.SignerName).FontSize(11).SemiBold().FontColor(textColor);
                        if (config.SignerTitle is { Length: > 0 })
                            sig.Item().Text(config.SignerTitle).FontSize(10).FontColor(textColor);
                    });

                    // Date + verification
                    sigRow.RelativeItem().AlignRight().Column(info =>
                    {
                        info.Item().Text(dateLocation).FontSize(11).FontColor(textColor);
                        info.Item().PaddingTop(12)
                            .Text($"Código: {cert.Code}")
                            .FontSize(9).FontColor(textColor);
                        info.Item()
                            .Text(verifyUrl)
                            .FontSize(8).FontColor(primaryColor);
                    });
                });

                // ── Sponsors ──────────────────────────────────────────────────
                var sponsors = config.Sponsors.OrderBy(s => s.Order).ToList();
                if (sponsors.Count > 0)
                {
                    main.Item().PaddingTop(24).Column(sp =>
                    {
                        sp.Item().Height(1).Background("#DDDDDD");
                        sp.Item().PaddingTop(12).Row(spRow =>
                        {
                            spRow.AutoItem().AlignMiddle()
                                .Text("Apoio:").FontSize(9).FontColor(textColor);

                            foreach (var sponsor in sponsors)
                            {
                                spRow.AutoItem().PaddingLeft(16).AlignMiddle().Column(sLogo =>
                                {
                                    if (sponsor.LogoUrl is { Length: > 0 })
                                    {
                                        try
                                        {
                                            using var http = new System.Net.Http.HttpClient();
                                            var bytes = http.GetByteArrayAsync(sponsor.LogoUrl).GetAwaiter().GetResult();
                                            sLogo.Item().MaxHeight(36).MaxWidth(100).Image(bytes).FitArea();
                                        }
                                        catch
                                        {
                                            sLogo.Item().Text(sponsor.Name).FontSize(9).FontColor(textColor);
                                        }
                                    }
                                    else
                                    {
                                        sLogo.Item().Text(sponsor.Name).FontSize(9).FontColor(textColor);
                                    }
                                });
                            }
                        });
                    });
                }
            });

            // ── Bottom accent bar ─────────────────────────────────────────────
            col.Item().Height(12).Background(primaryColor);
        });
    }

    private static string ParseColor(string hex)
    {
        // QuestPDF aceita hex diretamente como string "#RRGGBB"
        if (hex.StartsWith('#')) return hex;
        return "#" + hex;
    }
}
