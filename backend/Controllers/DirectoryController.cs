using CrmBackend.Dtos;
using CrmBackend.Infrastructure;
using CrmBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmBackend.Controllers;

/// <summary>Контрагенти, послуги, прайс виконавців, взаємодії, відгуки, сповіщення, користувачі.</summary>
[Route("api")]
public class DirectoryController : MutationControllerBase
{
    private readonly DirectoryService _svc;

    public DirectoryController(DirectoryService svc, SnapshotService snapshot) : base(snapshot) => _svc = svc;

    [HttpPost("parties"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> AddParty(PartyRequest r) => Done(_svc.AddParty(r));

    [HttpPost("services"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> AddService(ServiceRequest r) => Done(_svc.AddService(r));

    [HttpPost("offers"), Authorize(Roles = $"{Roles.Manager},{Roles.Master}")]
    public Task<IActionResult> AddOffer(OfferRequest r) => Done(_svc.AddOffer(Me, r));

    [HttpDelete("offers"), Authorize(Roles = $"{Roles.Manager},{Roles.Master}")]
    public Task<IActionResult> DeleteOffer(OfferKeyRequest r) => Done(_svc.DeleteOffer(Me, r));

    [HttpPost("interactions"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> AddInteraction(InteractionRequest r) => Done(_svc.AddInteraction(r));

    [HttpPost("reviews"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> AddReview(ReviewRequest r) => Done(_svc.AddReview(Me, r));

    [HttpPatch("notifications/read")]
    public Task<IActionResult> MarkRead(NotificationIdRequest r) => Done(_svc.MarkRead(Me, r.Id));

    [HttpPatch("notifications/read-all")]
    public Task<IActionResult> MarkAllRead() => Done(_svc.MarkAllRead(Me));

    [HttpPost("users"), Authorize(Roles = Roles.Admin)]
    public Task<IActionResult> AddUser(AddUserRequest r) => Done(_svc.AddUser(r));

    [HttpPatch("users/role"), Authorize(Roles = Roles.Admin)]
    public Task<IActionResult> SetUserRole(SetUserRoleRequest r) => Done(_svc.SetUserRole(Me, r));

    [HttpDelete("users"), Authorize(Roles = Roles.Admin)]
    public Task<IActionResult> DeleteUser(UserIdRequest r) => Done(_svc.DeleteUser(Me, r.UserId));
}
