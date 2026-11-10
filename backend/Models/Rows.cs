namespace CrmBackend.Models;

// Рядки таблиць БД. Dapper зіставляє колонки snake_case з властивостями PascalCase.

public class UserRow
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Login { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "";
    public int? PartyId { get; set; }
    public int FailedAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
}

public class PartyRow
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string Addr { get; set; } = "";
    public decimal? Rating { get; set; }
}

public class ServiceRow
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Cat { get; set; } = "";
}

public class OfferRow
{
    public int PartyId { get; set; }
    public int ServiceId { get; set; }
    public decimal Price { get; set; }
    public int Days { get; set; }
}

public class DeviceRow
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public string Type { get; set; } = "";
    public string Brand { get; set; } = "";
    public string Model { get; set; } = "";
    public string Sn { get; set; } = "";
    public string? Note { get; set; }
}

public class OrderRow
{
    public int Id { get; set; }
    public string Num { get; set; } = "";
    public int ClientId { get; set; }
    public int DeviceId { get; set; }
    public string Description { get; set; } = "";
    public DateTime CreatedOn { get; set; }
    public string Status { get; set; } = "new";
    public int ManagerId { get; set; }
}

public class StageRow
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int N { get; set; }
    public int ServiceId { get; set; }
    public int? ExecId { get; set; }
    public string Status { get; set; } = "wait";
    public decimal Price { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? DoneAt { get; set; }
    public string? Concl { get; set; }
    public bool PriceAgreed { get; set; }
    public decimal? ProposalPrice { get; set; }
    public string? ProposalText { get; set; }
    public DateTime? ProposalDate { get; set; }
    public string? Reply { get; set; }
}

public class InteractionRow
{
    public int Id { get; set; }
    public int PartyId { get; set; }
    public string? OrderNum { get; set; }
    public DateTime OnDate { get; set; }
    public string Type { get; set; } = "";
    public string Text { get; set; } = "";
}

public class ReviewRow
{
    public int Id { get; set; }
    public int? StageId { get; set; }
    public int ExecId { get; set; }
    public int? AuthorId { get; set; }
    public int Score { get; set; }
    public string Text { get; set; } = "";
    public DateTime OnDate { get; set; }
    public string? Ref { get; set; }
}

public class NotificationRow
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Text { get; set; } = "";
    public string? Link { get; set; }
    public DateTime OnDate { get; set; }
    public bool IsRead { get; set; }
}
