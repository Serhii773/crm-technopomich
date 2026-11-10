using System.Globalization;
using CrmBackend.Dtos;
using CrmBackend.Infrastructure;
using CrmBackend.Models;
using CrmBackend.Repositories;

namespace CrmBackend.Services;

/// <summary>Контрагенти, послуги й прайс, взаємодії, відгуки, сповіщення, користувачі.</summary>
public class DirectoryService
{
    private readonly Db _db;
    private readonly DirectoryRepository _dir;
    private readonly OrderRepository _orders;
    private readonly UserRepository _users;

    public DirectoryService(Db db, DirectoryRepository dir, OrderRepository orders, UserRepository users)
    {
        _db = db;
        _dir = dir;
        _orders = orders;
        _users = users;
    }

    private static Dictionary<string, object?> Msg(string msg) => new() { ["msg"] = msg };

    // ---------- контрагенти й послуги ----------

    public Task<Dictionary<string, object?>> AddParty(PartyRequest r) => _db.RunAsync(async s =>
    {
        await _dir.PartyCreate(s, r.Name!.Trim(), r.Type!, r.Phone?.Trim() ?? "", r.Email?.Trim() ?? "", r.Addr?.Trim() ?? "");
        return Msg(r.Type == "client" ? "Контрагента додано" : "Виконавця додано. Відкрийте його картку, щоб вказати послуги й ціни.");
    });

    public Task<Dictionary<string, object?>> AddService(ServiceRequest r) => _db.RunAsync(async s =>
    {
        await _dir.ServiceCreate(s, r.Name!.Trim(), string.IsNullOrWhiteSpace(r.Cat) ? "Інше" : r.Cat.Trim());
        return Msg("Послугу додано");
    });

    /// <summary>Майстер керує лише власним прайсом; менеджер — будь-яким.</summary>
    private static void EnsureOwnOffers(CurrentUser me, int partyId)
    {
        if (me.Role == Roles.Master && me.PartyId != partyId)
            throw HttpException.Forbidden("Можна змінювати лише власний прайс");
    }

    public Task<Dictionary<string, object?>> AddOffer(CurrentUser me, OfferRequest r) => _db.TransactionAsync(async s =>
    {
        var partyId = Ids.Parse(r.PartyId, "p", "виконавець");
        var serviceId = Ids.Parse(r.ServiceId, "s", "послуга");
        EnsureOwnOffers(me, partyId);
        var party = await _dir.Party(s, partyId) ?? throw HttpException.NotFound("Виконавця не знайдено");
        if (party.Type == "client") throw HttpException.BadRequest("Контрагент не є виконавцем");
        if (await _dir.Service(s, serviceId) is null) throw HttpException.NotFound("Послугу не знайдено");
        if (await _dir.Offer(s, partyId, serviceId) is not null) throw HttpException.Conflict("Ця послуга вже є у виконавця");
        await _dir.OfferAdd(s, partyId, serviceId, r.Price, r.Days);
        return Msg("Послугу додано. Тепер виконавець є в підборі.");
    });

    public Task<Dictionary<string, object?>> DeleteOffer(CurrentUser me, OfferKeyRequest r) => _db.RunAsync(async s =>
    {
        var partyId = Ids.Parse(r.PartyId, "p", "виконавець");
        EnsureOwnOffers(me, partyId);
        await _dir.OfferRemove(s, partyId, Ids.Parse(r.ServiceId, "s", "послуга"));
        return Msg("Послугу прибрано");
    });

    // ---------- взаємодії та відгуки ----------

    public Task<Dictionary<string, object?>> AddInteraction(InteractionRequest r) => _db.RunAsync(async s =>
    {
        var partyId = Ids.Parse(r.PartyId, "p", "контрагент");
        if (await _dir.Party(s, partyId) is null) throw HttpException.NotFound("Контрагента не знайдено");
        var orderNum = string.IsNullOrWhiteSpace(r.OrderNum) ? null : r.OrderNum.Trim();
        await _dir.InteractionAdd(s, partyId, orderNum, r.Type!.Trim(), r.Text!.Trim());
        return Msg(orderNum is not null ? "Дзвінок записано. Тепер додайте погоджені етапи." : "Взаємодію записано");
    });

    public Task<Dictionary<string, object?>> AddReview(CurrentUser me, ReviewRequest r) => _db.TransactionAsync(async s =>
    {
        var t = await _orders.Stage(s, Ids.Parse(r.StageId, "t", "етап")) ?? throw HttpException.NotFound("Етап не знайдено");
        if (t.ExecId is null || t.Status != "done") throw HttpException.Conflict("Оцінити можна лише завершений етап");
        if (await _dir.ReviewExists(s, t.Id)) throw HttpException.Conflict("Цей етап уже оцінено");
        var o = (await _orders.Order(s, t.OrderId))!;
        var party = (await _dir.Party(s, t.ExecId.Value))!;
        var svc = (await _dir.Service(s, t.ServiceId))?.Name ?? "послуга";

        await _dir.ReviewAdd(s, t.Id, t.ExecId.Value, me.Id, r.Score, r.Text?.Trim() ?? "", o.Num);
        var avg = await _dir.AverageScore(s, t.ExecId.Value) ?? r.Score;
        await _dir.PartySetRating(s, t.ExecId.Value, Math.Round(avg, 2));
        foreach (var uid in await _users.MastersOf(s, t.ExecId.Value))
            await _dir.NotificationAdd(s, uid, $"Етап «{svc}» ({o.Num}) оцінено: {new string('★', r.Score)}", "/my-reviews");
        return Msg($"Відгук збережено. Рейтинг «{party.Name}»: {avg.ToString("F1", CultureInfo.InvariantCulture)}");
    });

    // ---------- сповіщення ----------

    public Task<Dictionary<string, object?>> MarkRead(CurrentUser me, string? id) => _db.RunAsync(async s =>
    {
        await _dir.NotificationRead(s, Ids.Parse(id, "n", "сповіщення"), me.Id);
        return new Dictionary<string, object?>();
    });

    public Task<Dictionary<string, object?>> MarkAllRead(CurrentUser me) => _db.RunAsync(async s =>
    {
        await _dir.NotificationReadAll(s, me.Id);
        return new Dictionary<string, object?>();
    });

    // ---------- користувачі (адміністратор) ----------

    public Task<Dictionary<string, object?>> AddUser(AddUserRequest r) => _db.TransactionAsync(async s =>
    {
        var login = r.Login!.Trim();
        if (await _users.FindByLogin(s, login) is not null) throw HttpException.Conflict("Такий логін уже є");
        int? partyId = null;
        if (r.Role == Roles.Master)
        {
            partyId = Ids.ParseOpt(r.Party, "p", "виконавець") ?? throw HttpException.BadRequest("Для майстра вкажіть виконавця");
            if (await _dir.Party(s, partyId.Value) is null) throw HttpException.NotFound("Виконавця не знайдено");
        }
        // демо-пароль за замовчуванням — «demo», як на екрані входу; адміністратор може вказати свій
        await _users.Create(s, r.Name!.Trim(), login, AuthService.HashPassword(string.IsNullOrEmpty(r.Password) ? "demo" : r.Password), r.Role!, partyId);
        return Msg("Обліковий запис створено");
    });

    public Task<Dictionary<string, object?>> SetUserRole(CurrentUser me, SetUserRoleRequest r) => _db.TransactionAsync(async s =>
    {
        var id = Ids.Parse(r.UserId, "u", "користувач");
        if (id == me.Id) throw HttpException.Conflict("Не можна змінити роль власного облікового запису");
        var u = await _users.FindById(s, id) ?? throw HttpException.NotFound("Користувача не знайдено");
        int? partyId = r.Role == Roles.Master ? u.PartyId ?? 1 : null; // як у демо: майстер без виконавця прив'язується до центру
        await _users.SetRole(s, id, r.Role!, partyId);
        return Msg("Роль змінено");
    });

    public Task<Dictionary<string, object?>> DeleteUser(CurrentUser me, string? userId) => _db.TransactionAsync(async s =>
    {
        var id = Ids.Parse(userId, "u", "користувач");
        if (id == me.Id) throw HttpException.Conflict("Не можна видалити власний обліковий запис");
        if (!await _users.Remove(s, id)) throw HttpException.NotFound("Користувача не знайдено");
        return Msg("Користувача видалено");
    });
}
