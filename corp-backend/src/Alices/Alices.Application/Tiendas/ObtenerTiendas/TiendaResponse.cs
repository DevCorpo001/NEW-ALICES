namespace Alices.Application.Tiendas.ObtenerTiendas;

public sealed class TiendaResponse
{
    public required byte IdTienda { get; init; }
    public required string CodigoTienda { get; init; }
    public required string Direccion { get; init; }
}
