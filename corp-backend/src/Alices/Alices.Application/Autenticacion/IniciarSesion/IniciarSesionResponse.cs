namespace Alices.Application.Autenticacion.IniciarSesion;

public sealed class IniciarSesionResponse
{
    public required string Token { get; init; }
    public required string UsuarioId { get; init; }
    public required string Nombre { get; init; }
    public required string RolId { get; init; }
    public required string RolCodigo { get; init; }
    public required string RolNombre { get; init; }
    public required byte IdTienda { get; init; }
    public string? RutaVista { get; init; }
    public int? MaxSesiones { get; init; }
    public required DateTime ExpiraEn { get; init; }
}
