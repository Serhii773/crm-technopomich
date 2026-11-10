using System.Text;
using System.Text.Json;
using CrmBackend.Database;
using CrmBackend.Infrastructure;
using CrmBackend.Middleware;
using CrmBackend.Repositories;
using CrmBackend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

// timestamp без часового поясу (як у схемі БД) приймає DateTime будь-якого Kind
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
// Dapper: колонки snake_case → властивості PascalCase
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

// ---- DI: шари Repositories → Services → Controllers
builder.Services.AddSingleton<Db>();
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<DirectoryRepository>();
builder.Services.AddScoped<OrderRepository>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<SnapshotService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<DirectoryService>();

// ---- Контролери та єдиний формат помилок валідації (400)
builder.Services.AddControllers().ConfigureApiBehaviorOptions(o =>
{
    o.InvalidModelStateResponseFactory = ctx =>
    {
        var details = ctx.ModelState
            .Where(e => e.Value!.Errors.Count > 0)
            .SelectMany(e => e.Value!.Errors.Select(x => new
            {
                field = JsonNamingPolicy.CamelCase.ConvertName(e.Key),
                message = string.IsNullOrEmpty(x.ErrorMessage) ? "Некоректне значення" : x.ErrorMessage,
            }));
        return new BadRequestObjectResult(new { status = 400, message = "Помилка валідації даних", details });
    };
});

// ---- CORS для фронтенду
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(cfg["Cors:Origin"] ?? "http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));

// ---- JWT-автентифікація
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.MapInboundClaims = false; // залишаємо імена claim-ів "id", "role" тощо
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = cfg["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = cfg["Jwt:Audience"],
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!)),
        RoleClaimType = "role",
        NameClaimType = "name",
        ClockSkew = TimeSpan.Zero,
    };
    // 401 і 403 у єдиному JSON-форматі
    o.Events = new JwtBearerEvents
    {
        OnChallenge = ctx =>
        {
            ctx.HandleResponse();
            var msg = ctx.AuthenticateFailure is null ? "Необхідна автентифікація" : "Недійсний або прострочений токен";
            return WriteJson(ctx.Response, 401, msg);
        },
        OnForbidden = ctx => WriteJson(ctx.Response, 403, "Доступ заборонено"),
    };
});
builder.Services.AddAuthorization();

var app = builder.Build();

// Режим наповнення БД: dotnet run -- --seed
if (args.Contains("--seed"))
{
    await DbSeeder.RunAsync(app.Services.GetRequiredService<Db>());
    Console.WriteLine("База даних створена й заповнена демо-даними");
    return;
}

app.UseMiddleware<ErrorHandlingMiddleware>(); // перехоплює винятки та 404
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/api/health", () => new { status = "ok" }).AllowAnonymous();
app.MapControllers();
app.Run();

static Task WriteJson(HttpResponse res, int status, string message)
{
    res.StatusCode = status;
    res.ContentType = "application/json; charset=utf-8";
    return res.WriteAsync(JsonSerializer.Serialize(new { status, message }, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
}
