using Alices.Application.Familias.AgregarFamilia;
using Alices.Application.Familias.ListarFamiliaAuto;
using Alices.Application.Familias.ListarFamilias;
using Alices.Application.Familias.ObtenerSiguienteCodigoFamilia;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Familias;

[ApiController]
[Route("api/familias")]
public sealed class FamiliasController : ControllerBase
{
    private readonly ISender _sender;

    public FamiliasController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("autocomplete")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarAuto(
        [FromQuery] string? codigo,
        [FromQuery] string? nombre,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarFamiliaAutoQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar(
        [FromQuery] string? codigo,
        [FromQuery] string? nombre,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarFamiliasQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Código sugerido al abrir el alta de una familia nueva.</summary>
    [HttpGet("siguiente-codigo")]
    [AllowAnonymous]
    public async Task<IActionResult> SiguienteCodigo(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ObtenerSiguienteCodigoFamiliaQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Agregar(
        [FromBody] AgregarFamiliaRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new AgregarFamiliaCommand(request.Codigo, request.Nombre, request.Abreviado, request.CodigoLinea),
            cancellationToken);

        if (result.IsFailure)
        {
            return Conflict(new { error = result.Error.Code, message = result.Error.Name });
        }

        return NoContent();
    }
}

public sealed record AgregarFamiliaRequest(
    string Codigo,
    string Nombre,
    string? Abreviado,
    string? CodigoLinea);
