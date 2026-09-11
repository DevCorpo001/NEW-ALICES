using Alices.Application.Clases.AgregarClase;
using Alices.Application.Clases.ListarClaseAuto;
using Alices.Application.Clases.ListarClases;
using Alices.Application.Clases.ObtenerSiguienteCodigoClase;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Clases;

[ApiController]
[Route("api/clases")]
public sealed class ClasesController : ControllerBase
{
    private readonly ISender _sender;

    public ClasesController(ISender sender)
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
        var result = await _sender.Send(new ListarClaseAutoQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar(
        [FromQuery] string? codigo,
        [FromQuery] string? nombre,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarClasesQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Código sugerido al abrir el alta de una clase nueva.</summary>
    [HttpGet("siguiente-codigo")]
    [AllowAnonymous]
    public async Task<IActionResult> SiguienteCodigo(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ObtenerSiguienteCodigoClaseQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Agregar(
        [FromBody] AgregarClaseRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new AgregarClaseCommand(
                request.Codigo,
                request.Nombre,
                request.NombreCorto,
                request.CodigoLinea,
                request.CodigoFamilia),
            cancellationToken);

        if (result.IsFailure)
        {
            return Conflict(new { error = result.Error.Code, message = result.Error.Name });
        }

        return NoContent();
    }
}

public sealed record AgregarClaseRequest(
    string Codigo,
    string Nombre,
    string? NombreCorto,
    string? CodigoLinea,
    string? CodigoFamilia);
