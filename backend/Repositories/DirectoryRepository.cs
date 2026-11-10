using CrmBackend.Dtos;
using CrmBackend.Infrastructure;
using CrmBackend.Models;
using Dapper;

namespace CrmBackend.Repositories;

/// <summary>Контрагенти, послуги, прайс, пристрої, взаємодії, відгуки, сповіщення.</summary>
public class DirectoryRepository
{
    // ---------- контрагенти ----------
    public async Task<List<PartyRow>> Parties(Session s) =>
        (await s.Conn.QueryAsync<PartyRow>("SELECT * FROM counterparties ORDER BY id", transaction: s.Tx)).ToList();

    public Task<PartyRow?> Party(Session s, int id) =>
        s.Conn.QuerySingleOrDefaultAsync<PartyRow>("SELECT * FROM counterparties WHERE id = @id", new { id }, s.Tx);

    public Task<int> PartyCreate(Session s, string name, string type, string phone, string email, string addr) =>
        s.Conn.ExecuteScalarAsync<int>(
            "INSERT INTO counterparties (name, type, phone, email, addr) VALUES (@name, @type, @phone, @email, @addr) RETURNING id",
            new { name, type, phone, email, addr }, s.Tx);

    // ---------- послуги та прайс ----------
    public async Task<List<ServiceRow>> Services(Session s) =>
        (await s.Conn.QueryAsync<ServiceRow>("SELECT * FROM services ORDER BY id", transaction: s.Tx)).ToList();

    public Task<ServiceRow?> Service(Session s, int id) =>
        s.Conn.QuerySingleOrDefaultAsync<ServiceRow>("SELECT * FROM services WHERE id = @id", new { id }, s.Tx);

    public Task<int> ServiceCreate(Session s, string name, string cat) =>
        s.Conn.ExecuteScalarAsync<int>("INSERT INTO services (name, cat) VALUES (@name, @cat) RETURNING id", new { name, cat }, s.Tx);

    public async Task<List<OfferRow>> Offers(Session s) =>
        (await s.Conn.QueryAsync<OfferRow>("SELECT * FROM executor_services ORDER BY party_id, service_id", transaction: s.Tx)).ToList();

    public Task<OfferRow?> Offer(Session s, int partyId, int serviceId) =>
        s.Conn.QuerySingleOrDefaultAsync<OfferRow>("SELECT * FROM executor_services WHERE party_id = @partyId AND service_id = @serviceId",
            new { partyId, serviceId }, s.Tx);

    public Task OfferAdd(Session s, int partyId, int serviceId, decimal price, int days) =>
        s.Conn.ExecuteAsync("INSERT INTO executor_services (party_id, service_id, price, days) VALUES (@partyId, @serviceId, @price, @days)",
            new { partyId, serviceId, price, days }, s.Tx);

    public Task OfferRemove(Session s, int partyId, int serviceId) =>
        s.Conn.ExecuteAsync("DELETE FROM executor_services WHERE party_id = @partyId AND service_id = @serviceId", new { partyId, serviceId }, s.Tx);

    // ---------- пристрої ----------
    public async Task<List<DeviceRow>> Devices(Session s) =>
        (await s.Conn.QueryAsync<DeviceRow>("SELECT * FROM devices ORDER BY id", transaction: s.Tx)).ToList();

    public Task<DeviceRow?> Device(Session s, int id) =>
        s.Conn.QuerySingleOrDefaultAsync<DeviceRow>("SELECT * FROM devices WHERE id = @id", new { id }, s.Tx);

    public Task<int> DeviceCreate(Session s, int ownerId, DeviceDto d) =>
        s.Conn.ExecuteScalarAsync<int>(
            @"INSERT INTO devices (owner_id, type, brand, model, sn, note)
              VALUES (@ownerId, @Type, @Brand, @Model, @Sn, @Note) RETURNING id",
            new { ownerId, d.Type, Brand = d.Brand ?? "", Model = d.Model ?? "", Sn = d.Sn ?? "", d.Note }, s.Tx);

    public Task DeviceUpdate(Session s, int id, DeviceDto d) =>
        s.Conn.ExecuteAsync(
            @"UPDATE devices SET type = @Type, brand = @Brand, model = @Model, sn = @Sn,
                     note = CASE WHEN @SetNote THEN @Note ELSE note END
              WHERE id = @id",
            new { id, d.Type, Brand = d.Brand ?? "", Model = d.Model ?? "", Sn = d.Sn ?? "", d.Note, SetNote = d.Note is not null }, s.Tx);

    // ---------- взаємодії ----------
    public async Task<List<InteractionRow>> Interactions(Session s) =>
        (await s.Conn.QueryAsync<InteractionRow>("SELECT * FROM interactions ORDER BY id", transaction: s.Tx)).ToList();

    public Task InteractionAdd(Session s, int partyId, string? orderNum, string type, string text) =>
        s.Conn.ExecuteAsync("INSERT INTO interactions (party_id, order_num, type, text) VALUES (@partyId, @orderNum, @type, @text)",
            new { partyId, orderNum, type, text }, s.Tx);

    // ---------- відгуки ----------
    public async Task<List<ReviewRow>> Reviews(Session s) =>
        (await s.Conn.QueryAsync<ReviewRow>("SELECT * FROM reviews ORDER BY id", transaction: s.Tx)).ToList();

    public Task ReviewAdd(Session s, int stageId, int execId, int authorId, int score, string text, string reference) =>
        s.Conn.ExecuteAsync(
            "INSERT INTO reviews (stage_id, exec_id, author_id, score, text, ref) VALUES (@stageId, @execId, @authorId, @score, @text, @reference)",
            new { stageId, execId, authorId, score, text, reference }, s.Tx);

    public async Task<bool> ReviewExists(Session s, int stageId) =>
        await s.Conn.ExecuteScalarAsync<int>("SELECT COUNT(*)::int FROM reviews WHERE stage_id = @stageId", new { stageId }, s.Tx) > 0;

    public Task PartySetRating(Session s, int id, decimal rating) =>
        s.Conn.ExecuteAsync("UPDATE counterparties SET rating = @rating WHERE id = @id", new { id, rating }, s.Tx);

    public Task<decimal?> AverageScore(Session s, int execId) =>
        s.Conn.ExecuteScalarAsync<decimal?>("SELECT AVG(score)::numeric FROM reviews WHERE exec_id = @execId", new { execId }, s.Tx);

    // ---------- сповіщення ----------
    public async Task<List<NotificationRow>> Notifications(Session s) =>
        (await s.Conn.QueryAsync<NotificationRow>("SELECT * FROM notifications ORDER BY id", transaction: s.Tx)).ToList();

    public Task NotificationAdd(Session s, int userId, string text, string link) =>
        s.Conn.ExecuteAsync("INSERT INTO notifications (user_id, text, link) VALUES (@userId, @text, @link)", new { userId, text, link }, s.Tx);

    public Task NotificationRead(Session s, int id, int userId) =>
        s.Conn.ExecuteAsync("UPDATE notifications SET is_read = TRUE WHERE id = @id AND user_id = @userId", new { id, userId }, s.Tx);

    public Task NotificationReadAll(Session s, int userId) =>
        s.Conn.ExecuteAsync("UPDATE notifications SET is_read = TRUE WHERE user_id = @userId AND is_read = FALSE", new { userId }, s.Tx);
}
