using CrmBackend.Infrastructure;
using CrmBackend.Models;
using Dapper;

namespace CrmBackend.Repositories;

public class UserRepository
{
    public async Task<List<UserRow>> FindAll(Session s) =>
        (await s.Conn.QueryAsync<UserRow>("SELECT * FROM users ORDER BY id", transaction: s.Tx)).ToList();

    public Task<UserRow?> FindById(Session s, int id) =>
        s.Conn.QuerySingleOrDefaultAsync<UserRow>("SELECT * FROM users WHERE id = @id", new { id }, s.Tx);

    public Task<UserRow?> FindByLogin(Session s, string login) =>
        s.Conn.QuerySingleOrDefaultAsync<UserRow>("SELECT * FROM users WHERE lower(login) = lower(@login)", new { login }, s.Tx);

    /// <summary>Ідентифікатори майстрів виконавця (кому адресувати сповіщення).</summary>
    public async Task<List<int>> MastersOf(Session s, int partyId) =>
        (await s.Conn.QueryAsync<int>("SELECT id FROM users WHERE role = 'master' AND party_id = @partyId ORDER BY id",
            new { partyId }, s.Tx)).ToList();

    public Task<int> Create(Session s, string name, string login, string passwordHash, string role, int? partyId) =>
        s.Conn.ExecuteScalarAsync<int>(
            @"INSERT INTO users (name, login, password_hash, role, party_id)
              VALUES (@name, @login, @passwordHash, @role, @partyId) RETURNING id",
            new { name, login, passwordHash, role, partyId }, s.Tx);

    public Task SetRole(Session s, int id, string role, int? partyId) =>
        s.Conn.ExecuteAsync("UPDATE users SET role = @role, party_id = @partyId WHERE id = @id", new { id, role, partyId }, s.Tx);

    public async Task<bool> Remove(Session s, int id) =>
        await s.Conn.ExecuteAsync("DELETE FROM users WHERE id = @id", new { id }, s.Tx) > 0;

    public Task RegisterFailure(Session s, int id, int attempts, DateTime? lockedUntil) =>
        s.Conn.ExecuteAsync("UPDATE users SET failed_attempts = @attempts, locked_until = @lockedUntil::timestamp WHERE id = @id",
            new { id, attempts, lockedUntil }, s.Tx);

    public Task ResetFailures(Session s, int id) =>
        s.Conn.ExecuteAsync("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = @id", new { id }, s.Tx);
}
