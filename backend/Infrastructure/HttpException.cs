namespace CrmBackend.Infrastructure;

/// <summary>Помилка з відомим HTTP-статусом; перетворюється на JSON-відповідь у ErrorHandlingMiddleware.</summary>
public class HttpException : Exception
{
    public int Status { get; }
    public object? Details { get; }
    public HttpException(int status, string message, object? details = null) : base(message)
    {
        Status = status;
        Details = details;
    }

    public static HttpException BadRequest(string m, object? d = null) => new(400, m, d);
    public static HttpException Unauthorized(string m = "Необхідна автентифікація") => new(401, m);
    public static HttpException Forbidden(string m = "Доступ заборонено") => new(403, m);
    public static HttpException NotFound(string m = "Ресурс не знайдено") => new(404, m);
    public static HttpException Conflict(string m) => new(409, m);
}
