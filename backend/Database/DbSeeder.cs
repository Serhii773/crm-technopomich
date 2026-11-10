using CrmBackend.Infrastructure;
using CrmBackend.Services;
using Dapper;

namespace CrmBackend.Database;

/// <summary>Створює таблиці (schema.sql) і заповнює демо-даними (seed.sql). Запуск: dotnet run -- --seed</summary>
public static class DbSeeder
{
    public const string DemoPassword = "demo";

    public static async Task RunAsync(Db db)
    {
        var dir = Path.Combine(AppContext.BaseDirectory, "Database");
        var schema = await File.ReadAllTextAsync(Path.Combine(dir, "schema.sql"));
        var seed = (await File.ReadAllTextAsync(Path.Combine(dir, "seed.sql")))
            .Replace("{{HASH}}", AuthService.HashPassword(DemoPassword));

        await db.TransactionAsync(async s =>
        {
            await s.Conn.ExecuteAsync(schema, transaction: s.Tx);
            await s.Conn.ExecuteAsync(seed, transaction: s.Tx);
            return true;
        });
    }
}
