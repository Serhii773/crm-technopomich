using CrmBackend.Infrastructure;
using CrmBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmBackend.Controllers;

/// <summary>Базовий контролер: усі маршрути потребують JWT-токена, якщо не вказано [AllowAnonymous].</summary>
[ApiController]
[Authorize]
public abstract class ApiControllerBase : ControllerBase
{
    protected CurrentUser Me => CurrentUser.From(User);
}

/// <summary>
/// Контролер операцій зміни даних. Відповідь у форматі, який очікує фронтенд:
/// { db: актуальний знімок даних, result: { msg, ... } }.
/// </summary>
public abstract class MutationControllerBase : ApiControllerBase
{
    private readonly SnapshotService _snapshot;
    protected MutationControllerBase(SnapshotService snapshot) => _snapshot = snapshot;

    protected async Task<IActionResult> Done(Task<Dictionary<string, object?>> operation)
    {
        var result = await operation;
        return Ok(new { db = await _snapshot.Build(Me), result });
    }
}
