using System.Diagnostics;
using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/streams")]
public class StreamsController(AppDbContext db, IConfiguration configuration, ILogger<StreamsController> logger) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<StreamAdminDto>>> GetAll()
    {
        var streams = await db.LiveStreams
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapAdminDto(s))
            .ToListAsync();
        return Ok(streams);
    }

    /// <summary>
    /// Returns stream info. Admins get the full DTO (with StreamKey).
    /// Students/other authenticated users get a public DTO (no StreamKey).
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult> GetById(Guid id)
    {
        var stream = await db.LiveStreams.FindAsync(id);
        if (stream is null) return NotFound();

        if (User.IsInRole("Admin"))
            return Ok(MapAdminDto(stream));

        return Ok(MapPublicDto(stream));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StreamAdminDto>> Create([FromBody] CreateStreamRequest request)
    {
        var streamKey = Guid.NewGuid().ToString("N"); // no hyphens, clean key
        var rtmpBase = configuration["NginxRtmp:RtmpUrl"] ?? "rtmp://localhost:1935/live";
        var hlsBase = configuration["NginxRtmp:HlsBaseUrl"] ?? "http://localhost:8090/hls";

        var stream = new LiveStream
        {
            Title = request.Title,
            StreamKey = streamKey,
            HlsUrl = $"{hlsBase}/{streamKey}/index.m3u8",
            ScheduledAt = request.ScheduledAt,
            CreatedById = CurrentUserId
        };

        db.LiveStreams.Add(stream);
        await db.SaveChangesAsync();

        return Ok(new
        {
            stream.Id,
            stream.Title,
            StreamKey = streamKey,
            stream.HlsUrl,
            Status = stream.Status.ToString(),
            RtmpUrl = rtmpBase,
            Instructions = $"Server={rtmpBase}, Key={streamKey}"
        });
    }

    [HttpPost("{id:guid}/end")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StreamAdminDto>> End(Guid id)
    {
        var stream = await db.LiveStreams.FindAsync(id);
        if (stream is null) return NotFound();
        stream.Status = StreamStatus.Ended;
        stream.EndedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(MapAdminDto(stream));
    }

    /// <summary>
    /// Called by nginx-rtmp on_publish. Protected by a shared secret
    /// so only the nginx-rtmp container can trigger this.
    /// </summary>
    [HttpPost("rtmp/auth")]
    public async Task<IActionResult> RtmpAuth([FromForm] string name)
    {
        // Validate shared secret (nginx passes it as a header)
        var expectedSecret = configuration["NginxRtmp:CallbackSecret"];
        if (!string.IsNullOrEmpty(expectedSecret))
        {
            var receivedSecret = Request.Headers["X-Rtmp-Secret"].ToString();
            if (receivedSecret != expectedSecret)
            {
                logger.LogWarning("RTMP auth rejected: invalid secret from {IP}",
                    HttpContext.Connection.RemoteIpAddress);
                return StatusCode(403);
            }
        }

        var stream = await db.LiveStreams.FirstOrDefaultAsync(s => s.StreamKey == name);
        if (stream is null || stream.Status == StreamStatus.Ended)
        {
            logger.LogWarning("Rejected RTMP stream with key: {Key}", name);
            return StatusCode(403);
        }

        stream.Status = StreamStatus.Live;
        stream.StartedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        logger.LogInformation("RTMP stream started: {Key}", name);
        return Ok();
    }

    /// <summary>Called by nginx-rtmp on_publish_done. Same secret validation.</summary>
    [HttpPost("rtmp/done")]
    public async Task<IActionResult> RtmpDone([FromForm] string name)
    {
        var expectedSecret = configuration["NginxRtmp:CallbackSecret"];
        if (!string.IsNullOrEmpty(expectedSecret))
        {
            var receivedSecret = Request.Headers["X-Rtmp-Secret"].ToString();
            if (receivedSecret != expectedSecret)
                return StatusCode(403);
        }

        var stream = await db.LiveStreams.FirstOrDefaultAsync(s => s.StreamKey == name);
        if (stream is not null && stream.Status == StreamStatus.Live)
        {
            stream.Status = StreamStatus.Ended;
            stream.EndedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        return Ok();
    }

    // WebSocket endpoint for browser-based broadcasting
    [HttpGet("{id:guid}/broadcast")]
    [Authorize(Roles = "Admin")]
    public async Task BroadcastWebSocket(Guid id)
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = 400;
            return;
        }

        var stream = await db.LiveStreams.FindAsync(id);
        if (stream is null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        var rtmpUrl = $"{configuration["NginxRtmp:RtmpUrl"]}/{stream.StreamKey}";

        var ffmpegArgs = $"-re -fflags +genpts -i pipe:0 " +
            "-c:v libx264 -preset veryfast -tune zerolatency -b:v 2000k " +
            "-c:a aac -b:a 128k " +
            $"-f flv {rtmpUrl}";

        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = ffmpegArgs,
                RedirectStandardInput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };
        process.Start();

        var buffer = new byte[65536];
        var ct = HttpContext.RequestAborted;

        try
        {
            while (webSocket.State == System.Net.WebSockets.WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(buffer, ct);
                if (result.MessageType == System.Net.WebSockets.WebSocketMessageType.Close)
                    break;

                await process.StandardInput.BaseStream.WriteAsync(buffer.AsMemory(0, result.Count), ct);
            }
        }
        catch (OperationCanceledException) { }
        finally
        {
            process.StandardInput.Close();
            await process.WaitForExitAsync(CancellationToken.None);
            process.Dispose();
        }
    }

    private static StreamAdminDto MapAdminDto(LiveStream s) => new(
        s.Id, s.Title, s.StreamKey, s.HlsUrl,
        s.Status.ToString(), s.ScheduledAt, s.StartedAt, s.EndedAt, s.CreatedAt
    );

    private static StreamPublicDto MapPublicDto(LiveStream s) => new(
        s.Id, s.Title, s.HlsUrl,
        s.Status.ToString(), s.ScheduledAt, s.StartedAt, s.EndedAt, s.CreatedAt
    );
}
