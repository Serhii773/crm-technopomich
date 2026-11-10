using System.ComponentModel.DataAnnotations;

namespace CrmBackend.Dtos;

// Вхідні дані перевіряються атрибутами DataAnnotations. Помилки повертаються як 400 у форматі
// { status, message, details: [{ field, message }] } (див. Program.cs).
// Усі необов'язкові рядки оголошено як string?, щоб порожній рядок із фронтенду не вважався помилкою.

public static class Rx
{
    public const string Phone = @"^$|^\+?[0-9 ()\-]{7,25}$";
    public const string Email = @"^$|^[^@\s]+@[^@\s]+\.[^@\s]+$";
}

public class LoginRequest
{
    [Required(ErrorMessage = "Вкажіть логін")] public string? Login { get; set; }
    [Required(ErrorMessage = "Вкажіть пароль")] public string? Password { get; set; }
}

public class NewClientDto
{
    [Required(ErrorMessage = "Вкажіть ПІБ або назву клієнта"), MaxLength(150)] public string? Name { get; set; }
    [RegularExpression(Rx.Phone, ErrorMessage = "Некоректний номер телефону")] public string? Phone { get; set; }
    [RegularExpression(Rx.Email, ErrorMessage = "Некоректний email")] public string? Email { get; set; }
}

public class DeviceDto
{
    [Required(ErrorMessage = "Вкажіть тип пристрою"), MaxLength(30)] public string? Type { get; set; }
    [MaxLength(100)] public string? Brand { get; set; }
    [MaxLength(150)] public string? Model { get; set; }
    [MaxLength(100)] public string? Sn { get; set; }
    [MaxLength(500)] public string? Note { get; set; }
}

public class CreateOrderRequest : IValidatableObject
{
    public string? ClientId { get; set; }
    public NewClientDto? NewClient { get; set; }
    public string? DeviceId { get; set; }
    public DeviceDto? NewDevice { get; set; }
    [Required(ErrorMessage = "Опишіть несправність"), MaxLength(2000)] public string? Desc { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
    {
        if (string.IsNullOrEmpty(ClientId) && NewClient is null)
            yield return new("Вкажіть клієнта або дані нового клієнта", new[] { nameof(ClientId) });
        if (string.IsNullOrEmpty(DeviceId) && NewDevice is null)
            yield return new("Вкажіть пристрій або дані нового пристрою", new[] { nameof(DeviceId) });
    }
}

public class OrderIdRequest { [Required] public string? OrderId { get; set; } }

public class UpdateDeviceRequest
{
    [Required] public string? DeviceId { get; set; }
    [Required] public DeviceDto? Values { get; set; }
}

public class AddStageRequest
{
    [Required] public string? OrderId { get; set; }
    [Required] public string? ServiceId { get; set; }
}

public class StageIdRequest { [Required] public string? StageId { get; set; } }

public class AssignStageRequest
{
    [Required] public string? StageId { get; set; }
    [Required] public string? PartyId { get; set; }
}

public class StagePriceRequest
{
    [Required] public string? StageId { get; set; }
    [Range(0, 10_000_000, ErrorMessage = "Ціна має бути від 0 до 10 000 000")] public decimal Price { get; set; }
}

public class FinishStageRequest
{
    [Required] public string? StageId { get; set; }
    [MaxLength(4000)] public string? Text { get; set; }
}

public class ProposalRequest
{
    [Required] public string? StageId { get; set; }
    [Range(0, 10_000_000)] public decimal? Price { get; set; }
    [Required(ErrorMessage = "Напишіть повідомлення"), MaxLength(2000)] public string? Text { get; set; }
}

public class InteractionRequest
{
    [Required] public string? PartyId { get; set; }
    public string? OrderNum { get; set; }
    [Required(ErrorMessage = "Вкажіть тип"), MaxLength(30)] public string? Type { get; set; }
    [Required(ErrorMessage = "Опишіть, про що домовились"), MaxLength(2000)] public string? Text { get; set; }
}

public class ReviewRequest
{
    [Required] public string? StageId { get; set; }
    [Range(1, 5, ErrorMessage = "Оцінка має бути від 1 до 5")] public int Score { get; set; }
    [MaxLength(2000)] public string? Text { get; set; }
}

public class PartyRequest
{
    [Required(ErrorMessage = "Вкажіть назву або ПІБ"), MaxLength(150)] public string? Name { get; set; }
    [Required, AllowedValues("client", "exec", "both", ErrorMessage = "Тип: client, exec або both")] public string? Type { get; set; }
    [RegularExpression(Rx.Phone, ErrorMessage = "Некоректний номер телефону")] public string? Phone { get; set; }
    [RegularExpression(Rx.Email, ErrorMessage = "Некоректний email")] public string? Email { get; set; }
    [MaxLength(300)] public string? Addr { get; set; }
}

public class ServiceRequest
{
    [Required(ErrorMessage = "Вкажіть назву послуги"), MaxLength(150)] public string? Name { get; set; }
    [MaxLength(100)] public string? Cat { get; set; }
}

public class OfferRequest
{
    [Required] public string? PartyId { get; set; }
    [Required] public string? ServiceId { get; set; }
    [Range(0, 10_000_000, ErrorMessage = "Ціна не може бути від’ємною")] public decimal Price { get; set; }
    [Range(1, 3650, ErrorMessage = "Термін — щонайменше 1 день")] public int Days { get; set; }
}

public class OfferKeyRequest
{
    [Required] public string? PartyId { get; set; }
    [Required] public string? ServiceId { get; set; }
}

public class AddUserRequest
{
    [Required(ErrorMessage = "Вкажіть ім’я"), MaxLength(100)] public string? Name { get; set; }
    [Required(ErrorMessage = "Вкажіть логін"), RegularExpression(@"^[A-Za-z0-9._-]{2,50}$", ErrorMessage = "Логін: 2–50 символів (літери, цифри, . _ -)")] public string? Login { get; set; }
    [Required, AllowedValues("admin", "manager", "head", "master", ErrorMessage = "Некоректна роль")] public string? Role { get; set; }
    public string? Party { get; set; }
    [MinLength(4, ErrorMessage = "Пароль — щонайменше 4 символи"), MaxLength(72)] public string? Password { get; set; }
}

public class SetUserRoleRequest
{
    [Required] public string? UserId { get; set; }
    [Required, AllowedValues("admin", "manager", "head", "master", ErrorMessage = "Некоректна роль")] public string? Role { get; set; }
}

public class UserIdRequest { [Required] public string? UserId { get; set; } }

public class NotificationIdRequest { [Required] public string? Id { get; set; } }
