namespace Alices.Application.Abstractions.Authentication;

public interface IJwtTokenGenerator
{
    AuthenticationToken Generate(
        string usuarioId,
        string rolId,
        string rolCodigo,
        string rolNombre,
        string nombre,
        string usuario,
        byte idTienda,
        string? rutaVista);
}

public sealed record AuthenticationToken(string AccessToken, DateTime ExpiresAtUtc);
