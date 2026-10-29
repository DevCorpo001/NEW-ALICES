using Alices.Application.Proveedores.AgregarProveedor;
using Alices.Application.Proveedores.ListarProveedorAuto;
using Alices.Application.Proveedores.ListarProveedores;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Proveedores;

[ApiController]
[Route("api/proveedores")]
public sealed class ProveedoresController : ControllerBase
{
    private readonly ISender _sender;

    public ProveedoresController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("autocomplete")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarAuto(
        [FromQuery] string? ruc,
        [FromQuery] string? razonSocial,
        [FromQuery] string? criterio,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarProveedorAutoQuery(ruc, razonSocial, criterio), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar(
        [FromQuery] string? ruc,
        [FromQuery] string? razonSocial,
        [FromQuery] string? criterio,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarProveedoresQuery(ruc, razonSocial, criterio), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Agregar(
        [FromBody] AgregarProveedorRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new AgregarProveedorCommand(
                request.Ruc,
                request.RazonSocial,
                request.NombreComercial,
                request.Direccion,
                request.NombreVendedor),
            cancellationToken);

        if (result.IsFailure)
        {
            return Conflict(new { error = result.Error.Code, message = result.Error.Name });
        }

        return NoContent();
    }
}

public sealed record AgregarProveedorRequest(
    string Ruc,
    string RazonSocial,
    string? NombreComercial,
    string? Direccion,
    string? NombreVendedor);
