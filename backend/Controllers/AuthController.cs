using CrmBackend.Database;
using CrmBackend.Dtos;
using CrmBackend.Infrastructure;
using CrmBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmBackend.Controllers;

[Route("api")]
public class AuthController : ApiControllerBase
{
    private readonly AuthService _auth;
    private readonly SnapshotService _snapshot;
    private readonly Db _db;

    public AuthController(AuthService auth, SnapshotService snapshot, Db db)
    {
        _auth = auth;
        _snapshot = snapshot;
        _db = db;
    }

    /// <summary>POST /api/login — вхід; повертає userId і JWT-токен.</summary>
    [AllowAnonymous, HttpPost("login")]
    public async Task<Dictionary<string, object?>> Login(LoginRequest r) => await _auth.Login(r.Login!, r.Password!);

    /// <summary>
    /// GET /api/db — усі дані для фронтенду. Без токена — лише публічна частина (екран входу);
    /// недійсний токен — 401, щоб фронтенд завершив сесію.
    /// </summary>
    [AllowAnonymous, HttpGet("db")]
    public async Task<Dictionary<string, object?>> GetDb()
    {
        if (User.Identity?.IsAuthenticated == true) return await _snapshot.Build(Me);
        if (Request.Headers.ContainsKey("Authorization")) throw HttpException.Unauthorized("Недійсний або прострочений токен");
        return await _snapshot.Build(null);
    }

    /// <summary>DELETE /api/db — скинути демо-дані до початкових (лише адміністратор).</summary>
    [HttpDelete("db"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> ResetDb()
    {
        await DbSeeder.RunAsync(_db);
        return Ok(new { ok = true });
    }
}
