using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CrmBackend.Infrastructure;
using CrmBackend.Models;
using CrmBackend.Repositories;
using Microsoft.IdentityModel.Tokens;

namespace CrmBackend.Services;

public class AuthService
{
    private const int MaxAttempts = 5;
    private const int LockMinutes = 15;

    private readonly Db _db;
    private readonly UserRepository _users;
    private readonly IConfiguration _cfg;

    public AuthService(Db db, UserRepository users, IConfiguration cfg)
    {
        _db = db;
        _users = users;
        _cfg = cfg;
    }

    public static string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password, 10);

    /// <summary>Перевіряє логін і пароль (BCrypt), блокує акаунт після 5 помилок, видає JWT.</summary>
    public Task<Dictionary<string, object?>> Login(string login, string password) => _db.RunAsync(async s =>
    {
        var u = await _users.FindByLogin(s, login.Trim());
        // однакове повідомлення для неіснуючого логіна і хибного пароля
        if (u is null) throw HttpException.Unauthorized("Невірний логін або пароль");
        if (u.LockedUntil is { } until && until > DateTime.Now)
            throw new HttpException(429, $"Обліковий запис тимчасово заблоковано. Спробуйте через {LockMinutes} хв.");

        if (!BCrypt.Net.BCrypt.Verify(password, u.PasswordHash))
        {
            var attempts = u.FailedAttempts + 1;
            DateTime? lockUntil = attempts >= MaxAttempts ? DateTime.Now.AddMinutes(LockMinutes) : null;
            await _users.RegisterFailure(s, u.Id, lockUntil is null ? attempts : 0, lockUntil);
            throw HttpException.Unauthorized("Невірний логін або пароль");
        }
        await _users.ResetFailures(s, u.Id);

        return new Dictionary<string, object?>
        {
            ["userId"] = Ids.Of("u", u.Id),
            ["token"] = CreateToken(u),
            ["user"] = new { id = Ids.Of("u", u.Id), name = u.Name, login = u.Login, role = u.Role, party = Ids.Of("p", u.PartyId) },
        };
    });

    private string CreateToken(UserRow u)
    {
        var claims = new List<Claim> { new("id", u.Id.ToString()), new("name", u.Name), new("role", u.Role) };
        if (u.PartyId is not null) claims.Add(new Claim("partyId", u.PartyId.Value.ToString()));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"],
            audience: _cfg["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_cfg.GetValue("Jwt:ExpiresHours", 8)),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
