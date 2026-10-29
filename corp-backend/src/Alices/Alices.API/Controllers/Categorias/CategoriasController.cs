using Alices.Application.Categorias.AgregarCategoria;
using Alices.Application.Categorias.ListarCategoriaAuto;
using Alices.Application.Categorias.ListarCategorias;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Categorias;

[ApiController]
[Route("api/categorias")]
public sealed class CategoriasController : ControllerBase
{
    private readonly ISender _sender;

    public CategoriasController(ISender sender)
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
        var result = await _sender.Send(new ListarCategoriaAutoQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar(
        [FromQuery] string? codigo,
        [FromQuery] string? nombre,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarCategoriasQuery(codigo, nombre), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Agregar(
        [FromBody] AgregarCategoriaRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new AgregarCategoriaCommand(request.Codigo, request.Nombre),
            cancellationToken);

        if (result.IsFailure)
        {
            return Conflict(new { error = result.Error.Code, message = result.Error.Name });
        }

        return NoContent();
    }
}

public sealed record AgregarCategoriaRequest(string Codigo, string Nombre);
