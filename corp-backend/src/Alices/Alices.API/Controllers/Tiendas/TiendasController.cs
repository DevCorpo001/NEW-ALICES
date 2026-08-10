using Alices.Application.Tiendas.ObtenerTiendas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Tiendas;

[ApiController]
[Route("api/tiendas")]
public sealed class TiendasController : ControllerBase
{
    private readonly ISender _sender;

    public TiendasController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ObtenerTiendasQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
