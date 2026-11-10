using CrmBackend.Infrastructure;
using CrmBackend.Models;
using CrmBackend.Repositories;

namespace CrmBackend.Services;

/// <summary>
/// Збирає «знімок» даних у форматі, який очікує фронтенд (GET /api/db):
/// ідентифікатори з префіксами (p1, o3, t7), короткі назви полів, дати рядком yyyy-MM-dd.
/// Без токена віддається лише публічна частина (користувачі й назви виконавців для екрана входу).
/// </summary>
public class SnapshotService
{
    private readonly Db _db;
    private readonly UserRepository _users;
    private readonly DirectoryRepository _dir;
    private readonly OrderRepository _orders;

    public SnapshotService(Db db, UserRepository users, DirectoryRepository dir, OrderRepository orders)
    {
        _db = db;
        _users = users;
        _dir = dir;
        _orders = orders;
    }

    private static string? Date(DateTime? d) => d?.ToString("yyyy-MM-dd");

    private static object UserJson(UserRow u) => new { id = Ids.Of("u", u.Id), name = u.Name, login = u.Login, role = u.Role, party = Ids.Of("p", u.PartyId) };

    private static object PartyJson(PartyRow p) =>
        new { id = Ids.Of("p", p.Id), name = p.Name, type = p.Type, phone = p.Phone, email = p.Email, addr = p.Addr, rating = p.Rating };

    private static object StageJson(StageRow t)
    {
        var d = new Dictionary<string, object?>
        {
            ["id"] = Ids.Of("t", t.Id),
            ["order"] = Ids.Of("o", t.OrderId),
            ["n"] = t.N,
            ["service"] = Ids.Of("s", t.ServiceId),
            ["exec"] = Ids.Of("p", t.ExecId),
            ["status"] = t.Status,
            ["price"] = t.Price,
            ["start"] = Date(t.StartDate) ?? "",
            ["due"] = Date(t.DueDate) ?? "",
        };
        if (t.DoneAt is not null) d["doneAt"] = Date(t.DoneAt);
        if (!string.IsNullOrEmpty(t.Concl)) d["concl"] = t.Concl;
        if (t.PriceAgreed) d["priceAgreed"] = true;
        if (t.ProposalDate is not null)
            d["proposal"] = new { price = t.ProposalPrice, text = t.ProposalText ?? "", date = Date(t.ProposalDate) };
        if (!string.IsNullOrEmpty(t.Reply)) d["reply"] = t.Reply;
        return d;
    }

    private static object DeviceJson(DeviceRow x)
    {
        var d = new Dictionary<string, object?>
        {
            ["id"] = Ids.Of("d", x.Id), ["owner"] = Ids.Of("p", x.OwnerId), ["type"] = x.Type,
            ["brand"] = x.Brand, ["model"] = x.Model, ["sn"] = x.Sn,
        };
        if (!string.IsNullOrEmpty(x.Note)) d["note"] = x.Note;
        return d;
    }

    private static object InteractionJson(InteractionRow i)
    {
        var d = new Dictionary<string, object?>
        {
            ["id"] = Ids.Of("i", i.Id), ["party"] = Ids.Of("p", i.PartyId), ["date"] = Date(i.OnDate), ["type"] = i.Type, ["text"] = i.Text,
        };
        if (!string.IsNullOrEmpty(i.OrderNum)) d["order"] = i.OrderNum;
        return d;
    }

    /// <summary>Знімок для поточного користувача (me = null — публічна частина).</summary>
    public Task<Dictionary<string, object?>> Build(CurrentUser? me) => _db.RunAsync(async s =>
    {
        var users = await _users.FindAll(s);
        var parties = await _dir.Parties(s);

        if (me is null)
        {
            // публічна частина: лише те, що потрібно екрану входу
            return new Dictionary<string, object?>
            {
                ["users"] = users.Select(UserJson).ToList(),
                ["parties"] = parties.Select(p => new { id = Ids.Of("p", p.Id), name = p.Name, type = p.Type, phone = "", email = "", addr = "", rating = (decimal?)null }).ToList(),
                ["services"] = new List<object>(), ["offers"] = new List<object>(), ["devices"] = new List<object>(),
                ["orders"] = new List<object>(), ["stages"] = new List<object>(), ["interactions"] = new List<object>(),
                ["reviews"] = new List<object>(), ["notifications"] = new List<object>(),
                ["seq"] = new { order = 0, id = 0 },
            };
        }

        var services = await _dir.Services(s);
        var offers = await _dir.Offers(s);
        var devices = await _dir.Devices(s);
        var orders = await _orders.Orders(s);
        var stages = await _orders.Stages(s);
        var interactions = await _dir.Interactions(s);
        var reviews = await _dir.Reviews(s);
        var notifications = (await _dir.Notifications(s)).Where(n => n.UserId == me.Id);

        return new Dictionary<string, object?>
        {
            ["users"] = users.Select(UserJson).ToList(),
            ["parties"] = parties.Select(PartyJson).ToList(),
            ["services"] = services.Select(x => new { id = Ids.Of("s", x.Id), name = x.Name, cat = x.Cat }).ToList(),
            ["offers"] = offers.Select(o => new { p = Ids.Of("p", o.PartyId), s = Ids.Of("s", o.ServiceId), price = o.Price, days = o.Days }).ToList(),
            ["devices"] = devices.Select(DeviceJson).ToList(),
            ["orders"] = orders.Select(o => new
            {
                id = Ids.Of("o", o.Id), num = o.Num, client = Ids.Of("p", o.ClientId), device = Ids.Of("d", o.DeviceId),
                desc = o.Description, created = Date(o.CreatedOn), status = o.Status, manager = Ids.Of("u", o.ManagerId),
            }).ToList(),
            ["stages"] = stages.Select(StageJson).ToList(),
            ["interactions"] = interactions.Select(InteractionJson).ToList(),
            ["reviews"] = reviews.Select(r => new
            {
                id = Ids.Of("r", r.Id), stage = Ids.Of("t", r.StageId), exec = Ids.Of("p", r.ExecId), author = Ids.Of("u", r.AuthorId),
                score = r.Score, text = r.Text, date = Date(r.OnDate), @ref = r.Ref,
            }).ToList(),
            ["notifications"] = notifications.Select(n => new
            {
                id = Ids.Of("n", n.Id), user = Ids.Of("u", n.UserId), text = n.Text, link = n.Link, date = Date(n.OnDate), read = n.IsRead,
            }).ToList(),
            ["seq"] = new { order = 0, id = 0 },
        };
    });
}
