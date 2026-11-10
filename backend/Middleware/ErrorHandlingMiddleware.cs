using System.Text.Json;
using CrmBackend.Infrastructure;
using Npgsql;

namespace CrmBackend.Middleware;

/// <summary>Централізована обробка помилок: формат { status, message, details? }.</summary>
public class ErrorHandlingMiddleware
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _log;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> log)
    {
        _next = next;
        _log = log;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await _next(ctx);
            // 404 для невідомих маршрутів — у єдиному форматі
            if (ctx.Response.StatusCode == 404 && !ctx.Response.HasStarted)
                await Write(ctx, 404, $"Маршрут {ctx.Request.Method} {ctx.Request.Path} не знайдено", null);
        }
        catch (HttpException e)
        {
            await Write(ctx, e.Status, e.Message, e.Details);
        }
        catch (PostgresException e) when (Map(e.SqlState) is { } m)
        {
            await Write(ctx, m.Status, m.Message, null);
        }
        catch (BadHttpRequestException)
        {
            await Write(ctx, 400, "Некоректний запит", null);
        }
        catch (Exception e)
        {
            _log.LogError(e, "Необроблена помилка");
            await Write(ctx, 500, "Внутрішня помилка сервера", null);
        }
    }

    private static (int Status, string Message)? Map(string code) => code switch
    {
        "23505" => (409, "Запис із такими даними вже існує"),
        "23503" => (409, "Порушено зв’язок між даними (пов’язаний запис відсутній або використовується)"),
        "23514" => (400, "Значення не відповідає обмеженням"),
        "23502" => (400, "Не заповнено обов’язкове поле"),
        "22P02" => (400, "Некоректний формат даних"),
        _ => null,
    };

    private static Task Write(HttpContext ctx, int status, string message, object? details)
    {
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        object body = details is null ? new { status, message } : new { status, message, details };
        return ctx.Response.WriteAsync(JsonSerializer.Serialize(body, Json));
    }
}
