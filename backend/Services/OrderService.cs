using System.Globalization;
using CrmBackend.Dtos;
using CrmBackend.Infrastructure;
using CrmBackend.Models;
using CrmBackend.Repositories;

namespace CrmBackend.Services;

/// <summary>
/// Бізнес-логіка замовлень і етапів: створення, призначення виконавця, переходи станів
/// (Очікує → Призначено → Виконується → Завершено), узгодження ціни, автоматичний статус замовлення.
/// Кожна операція виконується в одній транзакції.
/// </summary>
public class OrderService
{
    public const int DiagnosisServiceId = 1; // «Діагностика» — перший етап кожного замовлення

    private readonly Db _db;
    private readonly OrderRepository _orders;
    private readonly DirectoryRepository _dir;
    private readonly UserRepository _users;

    public OrderService(Db db, OrderRepository orders, DirectoryRepository dir, UserRepository users)
    {
        _db = db;
        _orders = orders;
        _dir = dir;
        _users = users;
    }

    // ---------- допоміжні методи ----------

    /// <summary>Формат грошей як на фронтенді: «1 500 грн» (нерозривний пробіл між розрядами).</summary>
    public static string Money(decimal n) =>
        Math.Round(n, 0).ToString("N0", CultureInfo.InvariantCulture).Replace(",", " ") + " грн";

    private static string Link(OrderRow o) => "/orders/" + Ids.Of("o", o.Id);

    private async Task<OrderRow> GetOrder(Session s, int id) =>
        await _orders.Order(s, id) ?? throw HttpException.NotFound("Замовлення не знайдено");

    private async Task<StageRow> GetStage(Session s, string? id) =>
        await _orders.Stage(s, Ids.Parse(id, "t", "етап")) ?? throw HttpException.NotFound("Етап не знайдено");

    private async Task<string> ServiceName(Session s, int id) =>
        (await _dir.Service(s, id))?.Name ?? "послуга";

    private async Task Notify(Session s, IEnumerable<int> userIds, string text, string link)
    {
        foreach (var uid in userIds) await _dir.NotificationAdd(s, uid, text, link);
    }

    private async Task NotifyMasters(Session s, int partyId, string text, string link) =>
        await Notify(s, await _users.MastersOf(s, partyId), text, link);

    /// <summary>Сповіщення менеджеру замовлення про дію виконавця.</summary>
    private async Task NotifyManager(Session s, StageRow t, string what)
    {
        var o = await GetOrder(s, t.OrderId);
        var party = await _dir.Party(s, t.ExecId!.Value);
        await Notify(s, new[] { o.ManagerId }, $"{party?.Name} {what} «{await ServiceName(s, t.ServiceId)}» ({o.Num})", Link(o));
    }

    /// <summary>Статус замовлення залежить від етапів: new / work / done (cancel не змінюється).</summary>
    private async Task Recalc(Session s, int orderId)
    {
        var o = await _orders.Order(s, orderId);
        if (o is null || o.Status == "cancel") return;
        var st = await _orders.StagesOf(s, orderId);
        var status = st.Count > 0 && st.All(t => t.Status == "done") && st.Any(t => t.ServiceId != DiagnosisServiceId) ? "done"
            : st.Any(t => t.ExecId is not null) ? "work" : "new";
        await _orders.OrderSetStatus(s, orderId, status);
    }

    private async Task<decimal> OrderTotal(Session s, int orderId) =>
        (await _orders.StagesOf(s, orderId)).Where(t => t.ExecId is not null).Sum(t => t.Price);

    private static void EnsureOwnStage(StageRow t, CurrentUser me)
    {
        if (t.ExecId is null || me.PartyId != t.ExecId)
            throw HttpException.Forbidden("Цей етап призначено іншому виконавцю");
    }

    private static Dictionary<string, object?> Msg(string msg) => new() { ["msg"] = msg };

    // ---------- замовлення ----------

    public Task<Dictionary<string, object?>> CreateOrder(CurrentUser me, CreateOrderRequest r) => _db.TransactionAsync(async s =>
    {
        PartyRow client;
        if (r.NewClient is { } nc)
        {
            var id = await _dir.PartyCreate(s, nc.Name!.Trim(), "client", nc.Phone?.Trim() ?? "", nc.Email?.Trim() ?? "", "");
            client = (await _dir.Party(s, id))!;
        }
        else
            client = await _dir.Party(s, Ids.Parse(r.ClientId, "p", "клієнт")) ?? throw HttpException.NotFound("Клієнта не знайдено");

        int deviceId;
        if (r.NewDevice is { } nd)
            deviceId = await _dir.DeviceCreate(s, client.Id, nd);
        else
        {
            var d = await _dir.Device(s, Ids.Parse(r.DeviceId, "d", "пристрій")) ?? throw HttpException.NotFound("Пристрій не знайдено");
            if (d.OwnerId != client.Id) throw HttpException.BadRequest("Пристрій належить іншому клієнту");
            deviceId = d.Id;
        }

        var orderId = await _orders.OrderCreate(s, client.Id, deviceId, r.Desc!.Trim(), me.Id);
        // Перший етап «Діагностика» додається автоматично
        await _orders.StageAdd(s, orderId, 1, DiagnosisServiceId);
        var order = await GetOrder(s, orderId);

        return new Dictionary<string, object?>
        {
            ["orderId"] = Ids.Of("o", orderId),
            ["msg"] = string.IsNullOrEmpty(client.Phone) && string.IsNullOrEmpty(client.Email)
                ? $"Замовлення створено. Клієнт без контактів: видайте квитанцію {order.Num}."
                : "Замовлення створено. Додайте етапи ремонту.",
        };
    });

    public Task<Dictionary<string, object?>> CancelOrder(string? orderId) => _db.TransactionAsync(async s =>
    {
        var o = await GetOrder(s, Ids.Parse(orderId, "o", "замовлення"));
        if (o.Status is "cancel" or "done") throw HttpException.Conflict("Це замовлення вже закрите");
        await _orders.OrderSetStatus(s, o.Id, "cancel");
        var stages = await _orders.StagesOf(s, o.Id);
        // виконавців, чиї етапи ще не завершені, сповіщаємо про скасування
        foreach (var t in stages.Where(t => t.ExecId is not null && t.Status != "done"))
            await NotifyMasters(s, t.ExecId!.Value,
                $"Замовлення {o.Num} скасовано, етап «{await ServiceName(s, t.ServiceId)}» більше не потрібен", "/my-stages");
        foreach (var t in stages.Where(t => t.Status != "done"))
        {
            t.Status = "wait";
            await _orders.StageSave(s, t);
        }
        return Msg("Замовлення скасовано");
    });

    public Task<Dictionary<string, object?>> UpdateDevice(UpdateDeviceRequest r) => _db.TransactionAsync(async s =>
    {
        var id = Ids.Parse(r.DeviceId, "d", "пристрій");
        if (await _dir.Device(s, id) is null) throw HttpException.NotFound("Пристрій не знайдено");
        await _dir.DeviceUpdate(s, id, r.Values!);
        return Msg("Дані пристрою оновлено");
    });

    // ---------- етапи ----------

    public Task<Dictionary<string, object?>> AddStage(AddStageRequest r) => _db.TransactionAsync(async s =>
    {
        var o = await GetOrder(s, Ids.Parse(r.OrderId, "o", "замовлення"));
        if (o.Status == "cancel") throw HttpException.Conflict("До скасованого замовлення додати етап не можна");
        var serviceId = Ids.Parse(r.ServiceId, "s", "послуга");
        if (await _dir.Service(s, serviceId) is null) throw HttpException.NotFound("Послугу не знайдено");
        var n = (await _orders.StagesOf(s, o.Id)).Count + 1;
        var id = await _orders.StageAdd(s, o.Id, n, serviceId);
        await Recalc(s, o.Id);
        return new Dictionary<string, object?> { ["stageId"] = Ids.Of("t", id) };
    });

    public Task<Dictionary<string, object?>> DeleteStage(string? stageId) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, stageId);
        if (t.Status == "done") throw HttpException.Conflict("Завершений етап видалити не можна");
        await _orders.StageRemove(s, t.Id);
        var n = 1;
        foreach (var x in await _orders.StagesOf(s, t.OrderId)) // перенумерація
        {
            x.N = n++;
            await _orders.StageSave(s, x);
        }
        await Recalc(s, t.OrderId);
        return Msg("Етап видалено");
    });

    /// <summary>Менеджер призначає виконавця: ціна — з прайсу, термін — з поля «днів».</summary>
    public Task<Dictionary<string, object?>> AssignStage(AssignStageRequest r) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, r.StageId);
        if (t.Status is not ("wait" or "asg"))
            throw HttpException.Conflict("Призначити виконавця можна лише для етапу зі статусом «Очікує» або «Призначено»");
        var partyId = Ids.Parse(r.PartyId, "p", "виконавець");
        var party = await _dir.Party(s, partyId) ?? throw HttpException.NotFound("Виконавця не знайдено");
        var offer = await _dir.Offer(s, partyId, t.ServiceId) ?? throw HttpException.BadRequest("Цей виконавець не надає обрану послугу");

        t.ExecId = partyId;
        t.Price = offer.Price;
        t.Status = "asg";
        t.StartDate = DateTime.Today;
        t.DueDate = DateTime.Today.AddDays(offer.Days);
        await _orders.StageSave(s, t);
        await Recalc(s, t.OrderId);

        var o = await GetOrder(s, t.OrderId);
        await NotifyMasters(s, partyId, $"Вам призначено етап «{await ServiceName(s, t.ServiceId)}» (замовлення {o.Num})", "/my-stages");
        return Msg($"Етап призначено: {party.Name}. Виконавця сповіщено.");
    });

    public Task<Dictionary<string, object?>> SetStagePrice(StagePriceRequest r) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, r.StageId);
        if (t.ExecId is null) throw HttpException.Conflict("Спершу призначте виконавця");
        if (t.Status == "done") throw HttpException.Conflict("Ціну завершеного етапу змінювати не можна");
        var o = await GetOrder(s, t.OrderId);
        var old = t.Price;
        t.Price = r.Price;
        t.PriceAgreed = true;
        await _orders.StageSave(s, t);

        var svc = await ServiceName(s, t.ServiceId);
        await _dir.InteractionAdd(s, o.ClientId, o.Num, "Дзвінок", $"Погоджено ціну етапу «{svc}» ({o.Num}): {Money(old)} → {Money(r.Price)}.");
        await NotifyMasters(s, t.ExecId.Value, $"Ціну етапу «{svc}» ({o.Num}) змінено на {Money(r.Price)}", "/my-stages");
        return Msg($"Ціну змінено. Загальна сума {o.Num}: {Money(await OrderTotal(s, o.Id))}");
    });

    public Task<Dictionary<string, object?>> AcceptStage(CurrentUser me, string? stageId) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, stageId);
        EnsureOwnStage(t, me);
        if (t.Status != "asg") throw HttpException.Conflict("Прийняти можна лише етап зі статусом «Призначено»");
        t.Status = "run";
        await _orders.StageSave(s, t);
        await Recalc(s, t.OrderId);
        await NotifyManager(s, t, "прийняв етап");
        return Msg("Етап прийнято. Статус: «Виконується»");
    });

    public Task<Dictionary<string, object?>> DeclineStage(CurrentUser me, string? stageId) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, stageId);
        EnsureOwnStage(t, me);
        if (t.Status != "asg") throw HttpException.Conflict("Відхилити можна лише етап зі статусом «Призначено»");
        await NotifyManager(s, t, "відхилив етап (потрібен інший виконавець)"); // до скидання виконавця
        t.Status = "wait";
        t.ExecId = null;
        t.Price = 0;
        t.StartDate = null;
        t.DueDate = null;
        await _orders.StageSave(s, t);
        await Recalc(s, t.OrderId);
        return Msg("Етап відхилено. Менеджер підбере іншого виконавця.");
    });

    public Task<Dictionary<string, object?>> FinishStage(CurrentUser me, FinishStageRequest r) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, r.StageId);
        EnsureOwnStage(t, me);
        if (t.Status != "run") throw HttpException.Conflict("Завершити можна лише етап зі статусом «Виконується»");
        t.Status = "done";
        t.DoneAt = DateTime.Today;
        if (!string.IsNullOrWhiteSpace(r.Text)) t.Concl = r.Text.Trim();
        await _orders.StageSave(s, t);
        await Recalc(s, t.OrderId);

        var o = await GetOrder(s, t.OrderId);
        var diag = t.ServiceId == DiagnosisServiceId;
        await NotifyManager(s, t, diag ? "завершив діагностику, є висновок:" : "завершив етап");
        return Msg(diag ? "Діагностику завершено. Менеджер отримав висновок."
            : o.Status == "done" ? $"Етап завершено. Замовлення {o.Num} виконане!" : "Етап завершено");
    });

    public Task<Dictionary<string, object?>> SendProposal(CurrentUser me, ProposalRequest r) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, r.StageId);
        EnsureOwnStage(t, me);
        if (t.Status == "done") throw HttpException.Conflict("Етап уже завершено");
        t.ProposalPrice = r.Price is > 0 && r.Price != t.Price ? r.Price : null;
        t.ProposalText = r.Text!.Trim();
        t.ProposalDate = DateTime.Today;
        t.Reply = null;
        await _orders.StageSave(s, t);
        await NotifyManager(s, t, "надіслав повідомлення щодо етапу");
        return Msg("Повідомлення надіслано менеджеру");
    });

    public Task<Dictionary<string, object?>> ApproveProposal(string? stageId) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, stageId);
        if (t.ProposalDate is null) throw HttpException.Conflict("Немає повідомлення від виконавця");
        var o = await GetOrder(s, t.OrderId);
        var svc = await ServiceName(s, t.ServiceId);
        var newPrice = t.ProposalPrice;
        if (newPrice is not null)
        {
            await _dir.InteractionAdd(s, o.ClientId, o.Num, "Дзвінок", $"Погоджено нову ціну етапу «{svc}»: {Money(t.Price)} → {Money(newPrice.Value)}.");
            t.Price = newPrice.Value;
            t.PriceAgreed = true;
            t.Reply = $"ціну {Money(newPrice.Value)} погоджено з клієнтом";
        }
        else t.Reply = "прочитано";
        ClearProposal(t);
        await _orders.StageSave(s, t);
        if (t.ExecId is not null)
            await NotifyMasters(s, t.ExecId.Value, $"Менеджер відповів щодо етапу «{svc}» ({o.Num}): {t.Reply}", "/my-stages");
        return Msg(newPrice is not null ? $"Ціну змінено. Загальна сума {o.Num}: {Money(await OrderTotal(s, o.Id))}" : "Позначено як прочитане");
    });

    public Task<Dictionary<string, object?>> RejectProposal(string? stageId) => _db.TransactionAsync(async s =>
    {
        var t = await GetStage(s, stageId);
        if (t.ProposalDate is null) throw HttpException.Conflict("Немає повідомлення від виконавця");
        var o = await GetOrder(s, t.OrderId);
        var svc = await ServiceName(s, t.ServiceId);
        var price = t.ProposalPrice;
        if (price is not null)
            await _dir.InteractionAdd(s, o.ClientId, o.Num, "Дзвінок", $"Клієнт не погодився на нову ціну етапу «{svc}» ({Money(price.Value)}).");
        t.Reply = price is not null ? "клієнт не погодився на нову ціну, працюємо за попередньою або етап буде скасовано" : "відхилено";
        ClearProposal(t);
        await _orders.StageSave(s, t);
        if (t.ExecId is not null)
            await NotifyMasters(s, t.ExecId.Value, $"Менеджер відповів щодо етапу «{svc}» ({o.Num}): {t.Reply}", "/my-stages");
        return Msg("Відповідь надіслано майстру");
    });

    private static void ClearProposal(StageRow t)
    {
        t.ProposalPrice = null;
        t.ProposalText = null;
        t.ProposalDate = null;
    }
}
