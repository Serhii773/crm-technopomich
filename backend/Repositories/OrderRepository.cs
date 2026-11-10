using CrmBackend.Infrastructure;
using CrmBackend.Models;
using Dapper;

namespace CrmBackend.Repositories;

public class OrderRepository
{
    public async Task<List<OrderRow>> Orders(Session s) =>
        (await s.Conn.QueryAsync<OrderRow>("SELECT * FROM orders ORDER BY id", transaction: s.Tx)).ToList();

    public Task<OrderRow?> Order(Session s, int id) =>
        s.Conn.QuerySingleOrDefaultAsync<OrderRow>("SELECT * FROM orders WHERE id = @id", new { id }, s.Tx);

    /// <summary>Створює замовлення; номер Р-NNNN береться з послідовності order_num_seq.</summary>
    public Task<int> OrderCreate(Session s, int clientId, int deviceId, string description, int managerId) =>
        s.Conn.ExecuteScalarAsync<int>(
            @"INSERT INTO orders (num, client_id, device_id, description, manager_id)
              VALUES ('Р-' || nextval('order_num_seq'), @clientId, @deviceId, @description, @managerId) RETURNING id",
            new { clientId, deviceId, description, managerId }, s.Tx);

    public Task OrderSetStatus(Session s, int id, string status) =>
        s.Conn.ExecuteAsync("UPDATE orders SET status = @status WHERE id = @id", new { id, status }, s.Tx);

    // ---------- етапи ----------
    public async Task<List<StageRow>> Stages(Session s) =>
        (await s.Conn.QueryAsync<StageRow>("SELECT * FROM order_stages ORDER BY order_id, n", transaction: s.Tx)).ToList();

    public async Task<List<StageRow>> StagesOf(Session s, int orderId) =>
        (await s.Conn.QueryAsync<StageRow>("SELECT * FROM order_stages WHERE order_id = @orderId ORDER BY n", new { orderId }, s.Tx)).ToList();

    /// <summary>Читає етап із блокуванням рядка (FOR UPDATE), якщо виклик у транзакції.</summary>
    public Task<StageRow?> Stage(Session s, int id) =>
        s.Conn.QuerySingleOrDefaultAsync<StageRow>(
            s.Tx is null ? "SELECT * FROM order_stages WHERE id = @id" : "SELECT * FROM order_stages WHERE id = @id FOR UPDATE",
            new { id }, s.Tx);

    public Task<int> StageAdd(Session s, int orderId, int n, int serviceId) =>
        s.Conn.ExecuteScalarAsync<int>(
            "INSERT INTO order_stages (order_id, n, service_id) VALUES (@orderId, @n, @serviceId) RETURNING id",
            new { orderId, n, serviceId }, s.Tx);

    public Task StageSave(Session s, StageRow t) =>
        s.Conn.ExecuteAsync(
            @"UPDATE order_stages SET n = @N, exec_id = @ExecId::int, status = @Status, price = @Price,
                     start_date = @StartDate::date, due_date = @DueDate::date, done_at = @DoneAt::date,
                     concl = @Concl, price_agreed = @PriceAgreed,
                     proposal_price = @ProposalPrice::numeric, proposal_text = @ProposalText,
                     proposal_date = @ProposalDate::date, reply = @Reply
              WHERE id = @Id", t, s.Tx);

    public Task StageRemove(Session s, int id) =>
        s.Conn.ExecuteAsync("DELETE FROM order_stages WHERE id = @id", new { id }, s.Tx);
}
