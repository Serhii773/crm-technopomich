using Npgsql;

namespace CrmBackend.Infrastructure;

/// <summary>З'єднання (і, за потреби, транзакція), яке передається в репозиторії.</summary>
public sealed class Session
{
    public NpgsqlConnection Conn { get; }
    public NpgsqlTransaction? Tx { get; }
    public Session(NpgsqlConnection conn, NpgsqlTransaction? tx = null) { Conn = conn; Tx = tx; }
}

/// <summary>Фабрика з'єднань PostgreSQL. TransactionAsync виконує дії в одній транзакції (ROLLBACK при помилці).</summary>
public sealed class Db
{
    private readonly NpgsqlDataSource _source;
    public Db(IConfiguration cfg) =>
        _source = NpgsqlDataSource.Create(cfg.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Не задано ConnectionStrings:Default"));

    public async Task<T> RunAsync<T>(Func<Session, Task<T>> work)
    {
        await using var conn = await _source.OpenConnectionAsync();
        return await work(new Session(conn));
    }

    public async Task<T> TransactionAsync<T>(Func<Session, Task<T>> work)
    {
        await using var conn = await _source.OpenConnectionAsync();
        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            var result = await work(new Session(conn, tx));
            await tx.CommitAsync();
            return result;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
