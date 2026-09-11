using Alices.Application.Marcas.AgregarMarca;
using Alices.Application.Marcas.ListarMarcaAuto;
using Alices.Application.Marcas.ListarMarcas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Marcas;

[ApiController]
[Route("api/marcas")]
public sealed class MarcasController : ControllerBase
{
    private readonly ISender _sender;

    public MarcasController(ISender sender)
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
        var result = await _sender.Send(new ListarMarcaAutoQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar(
        [FromQuery] string? codigo,
        [FromQuery] string? nombre,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarMarcasQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Agregar(
        [FromBody] AgregarMarcaRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new AgregarMarcaCommand(request.Codigo, request.Nombre),
            cancellationToken);

        if (result.IsFailure)
        {
            return Conflict(new { error = result.Error.Code, message = result.Error.Name });
        }

        return NoContent();
    }
}

public sealed record AgregarMarcaRequest(string Codigo, string Nombre);
