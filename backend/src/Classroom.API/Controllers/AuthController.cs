using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Classroom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, JwtTokenService jwt) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    [HttpPost("login")]
    public async Task<ActionResult<TokenResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower() && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Credenciais inválidas" });

        var accessToken = jwt.GenerateAccessToken(user);
        var refreshToken = await CreateRefreshToken(user);

        SetRefreshTokenCookie(refreshToken.Token, refreshToken.ExpiresAt);

        return Ok(new TokenResponse(accessToken, 900, MapUserDto(user)));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<TokenResponse>> Refresh()
    {
        var token = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new { message = "Token de refresh não encontrado" });

        var refreshToken = await db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken is null || !refreshToken.IsActive || !refreshToken.User.IsActive)
            return Unauthorized(new { message = "Token inválido ou expirado" });

        // Rotate refresh token
        refreshToken.IsRevoked = true;
        var newRefreshToken = await CreateRefreshToken(refreshToken.User);
        await db.SaveChangesAsync();

        SetRefreshTokenCookie(newRefreshToken.Token, newRefreshToken.ExpiresAt);

        var accessToken = jwt.GenerateAccessToken(refreshToken.User);
        return Ok(new TokenResponse(accessToken, 900, MapUserDto(refreshToken.User)));
    }

    [Authorize]
    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke()
    {
        var token = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(token))
        {
            var refreshToken = await db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
            if (refreshToken is not null)
            {
                refreshToken.IsRevoked = true;
                await db.SaveChangesAsync();
            }
        }
        Response.Cookies.Delete("refreshToken");
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();
        return Ok(MapUserDto(user));
    }

    private async Task<RefreshToken> CreateRefreshToken(User user)
    {
        var token = new RefreshToken
        {
            UserId = user.Id,
            Token = jwt.GenerateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedByIp = ClientIp
        };
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();
        return token;
    }

    private void SetRefreshTokenCookie(string token, DateTime expires)
    {
        Response.Cookies.Append("refreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = expires
        });
    }

    private static UserDto MapUserDto(User u) => new(
        u.Id, u.Email, u.FirstName, u.LastName, u.FullName,
        u.Role.ToString(), u.AvatarUrl, u.IsActive, u.CreatedAt
    );
}
