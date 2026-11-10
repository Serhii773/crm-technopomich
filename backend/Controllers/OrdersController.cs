using CrmBackend.Dtos;
using CrmBackend.Infrastructure;
using CrmBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmBackend.Controllers;

/// <summary>Замовлення, пристрої та етапи ремонту.</summary>
[Route("api")]
public class OrdersController : MutationControllerBase
{
    private readonly OrderService _orders;

    public OrdersController(OrderService orders, SnapshotService snapshot) : base(snapshot) => _orders = orders;

    // ---------- замовлення ----------
    [HttpPost("orders"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> CreateOrder(CreateOrderRequest r) => Done(_orders.CreateOrder(Me, r));

    [HttpPatch("orders/cancel"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> CancelOrder(OrderIdRequest r) => Done(_orders.CancelOrder(r.OrderId));

    [HttpPatch("devices"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> UpdateDevice(UpdateDeviceRequest r) => Done(_orders.UpdateDevice(r));

    // ---------- етапи (менеджер) ----------
    [HttpPost("stages"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> AddStage(AddStageRequest r) => Done(_orders.AddStage(r));

    [HttpDelete("stages"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> DeleteStage(StageIdRequest r) => Done(_orders.DeleteStage(r.StageId));

    [HttpPatch("stages/assign"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> AssignStage(AssignStageRequest r) => Done(_orders.AssignStage(r));

    [HttpPatch("stages/price"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> SetStagePrice(StagePriceRequest r) => Done(_orders.SetStagePrice(r));

    [HttpPatch("stages/proposal/approve"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> ApproveProposal(StageIdRequest r) => Done(_orders.ApproveProposal(r.StageId));

    [HttpPatch("stages/proposal/reject"), Authorize(Roles = Roles.Manager)]
    public Task<IActionResult> RejectProposal(StageIdRequest r) => Done(_orders.RejectProposal(r.StageId));

    // ---------- етапи (майстер) ----------
    [HttpPatch("stages/accept"), Authorize(Roles = Roles.Master)]
    public Task<IActionResult> AcceptStage(StageIdRequest r) => Done(_orders.AcceptStage(Me, r.StageId));

    [HttpPatch("stages/decline"), Authorize(Roles = Roles.Master)]
    public Task<IActionResult> DeclineStage(StageIdRequest r) => Done(_orders.DeclineStage(Me, r.StageId));

    [HttpPatch("stages/finish"), Authorize(Roles = Roles.Master)]
    public Task<IActionResult> FinishStage(FinishStageRequest r) => Done(_orders.FinishStage(Me, r));

    [HttpPost("stages/proposal"), Authorize(Roles = Roles.Master)]
    public Task<IActionResult> SendProposal(ProposalRequest r) => Done(_orders.SendProposal(Me, r));
}
