using System.Security.Claims;

namespace CrmBackend.Infrastructure;

/// <summary>Коди ролей (збігаються з фронтендом і CHECK-обмеженням у БД).</summary>
public static class Roles
{
    public const string Admin = "admin";
    public const string Manager = "manager";
    public const string Head = "head";
    public const string Master = "master";
}

/// <summary>Дані поточного користувача з JWT.</summary>
public record CurrentUser(int Id, string Name, string Role, int? PartyId)
{
    public static CurrentUser From(ClaimsPrincipal p) => new(
        int.Parse(p.FindFirstValue("id")!),
        p.FindFirstValue("name") ?? "",
        p.FindFirstValue("role") ?? "",
        int.TryParse(p.FindFirstValue("partyId"), out var c) ? c : null);
}

/// <summary>Ідентифікатори для фронтенду мають префікс типу сутності: p1, o3, t7 ...</summary>
public static class Ids
{
    public static string Of(string prefix, int id) => prefix + id;
    public static string? Of(string prefix, int? id) => id is null ? null : prefix + id;

    public static int Parse(string? value, string prefix, string label)
    {
        if (value is not null && value.StartsWith(prefix) && int.TryParse(value.AsSpan(prefix.Length), out var n) && n > 0)
            return n;
        throw HttpException.BadRequest($"Некоректний ідентифікатор: {label}");
    }

    public static int? ParseOpt(string? value, string prefix, string label) =>
        string.IsNullOrEmpty(value) ? null : Parse(value, prefix, label);
}
