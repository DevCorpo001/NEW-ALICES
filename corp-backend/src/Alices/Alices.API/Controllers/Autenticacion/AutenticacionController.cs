using Alices.Application.Autenticacion.IniciarSesion;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Autenticacion;

[ApiController]
[Route("api/autenticacion")]
public sealed class AutenticacionController : ControllerBase
{
    private readonly ISender _sender;

    public AutenticacionController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new IniciarSesionCommand(
                request.Usuario,
                request.Clave,
                request.IdTienda,
                HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0"),
            cancellationToken);

        if (result.IsFailure)
        {
            return Unauthorized(new { error = result.Error.Code, message = result.Error.Name });
        }

        Response.Cookies.Append("access_token", result.Value.Token, BuildCookieOptions(result.Value.ExpiraEn));

        return Ok(new SesionResponse(
            result.Value.UsuarioId,
            result.Value.Nombre,
            result.Value.RolId,
            result.Value.RolCodigo,
            result.Value.RolNombre,
            result.Value.IdTienda,
            result.Value.RutaVista,
            result.Value.MaxSesiones,
            result.Value.ExpiraEn));
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub")?.Value;
        var rolId = User.FindFirst("rol_id")?.Value;
        var rolCodigo = User.FindFirstValue(ClaimTypes.Role);
        var nombre = User.Identity?.Name;
        var usuario = User.FindFirst("usuario")?.Value;
        var rolNombre = User.FindFirst("rol_nombre")?.Value;
        var tiendaId = User.FindFirst("tienda_id")?.Value;

        if (string.IsNullOrWhiteSpace(usuarioId)
            || string.IsNullOrWhiteSpace(rolId)
            || string.IsNullOrWhiteSpace(nombre)
            || string.IsNullOrWhiteSpace(usuario)
            || string.IsNullOrWhiteSpace(rolCodigo)
            || string.IsNullOrWhiteSpace(rolNombre)
            || !byte.TryParse(tiendaId, out var parsedTiendaId))
        {
            return Unauthorized();
        }

        return Ok(new SesionResponse(
            usuarioId,
            nombre,
            rolId,
            rolCodigo,
            rolNombre,
            parsedTiendaId,
            null,
            null,
            null));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("access_token", BuildCookieOptions(null));
        return NoContent();
    }

    private CookieOptions BuildCookieOptions(DateTime? expires)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            IsEssential = true,
            Expires = expires
        };
    }
}

public sealed record LoginRequest(string Usuario, string Clave, byte IdTienda);

public sealed record SesionResponse(
    string UsuarioId,
    string Nombre,
    string RolId,
    string RolCodigo,
    string RolNombre,
    byte IdTienda,
    string? RutaVista,
    int? MaxSesiones,
    DateTime? ExpiraEn);
