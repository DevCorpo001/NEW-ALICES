using Alices.Application.Lineas.AgregarLinea;
using Alices.Application.Lineas.ListarLineaAuto;
using Alices.Application.Lineas.ListarLineas;
using Alices.Application.Lineas.ObtenerSiguienteCodigoLinea;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Lineas;

[ApiController]
[Route("api/lineas")]
public sealed class LineasController : ControllerBase
{
    private readonly ISender _sender;

    public LineasController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Sugerencias para los buscadores de código y nombre.</summary>
    [HttpGet("autocomplete")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarAuto(
        [FromQuery] string? codigo,
        [FromQuery] string? nombre,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarLineaAutoQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Listado completo; sin filtros devuelve todas las líneas.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar(
        [FromQuery] string? codigo,
        [FromQuery] string? nombre,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarLineasQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Código sugerido al abrir el alta de una línea nueva.</summary>
    [HttpGet("siguiente-codigo")]
    [AllowAnonymous]
    public async Task<IActionResult> SiguienteCodigo(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ObtenerSiguienteCodigoLineaQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Agregar(
        [FromBody] AgregarLineaRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new AgregarLineaCommand(request.Codigo, request.Nombre, request.Abreviado),
            cancellationToken);

        if (result.IsFailure)
        {
            return Conflict(new { error = result.Error.Code, message = result.Error.Name });
        }

        return NoContent();
    }
}

public sealed record AgregarLineaRequest(string Codigo, string Nombre, string? Abreviado);
