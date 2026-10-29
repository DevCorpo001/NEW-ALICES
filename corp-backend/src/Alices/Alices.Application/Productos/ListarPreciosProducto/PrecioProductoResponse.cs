namespace Alices.Application.Productos.ListarPreciosProducto;

/// <summary>Precio de un producto en un canal, con sus rangos por cantidad.</summary>
public sealed class PrecioProductoResponse
{
    public required int IdPrecio { get; init; }
    public required int IdProducto { get; init; }
    public int IdGrupo { get; init; }
    public string? NombreGrupo { get; init; }
    public int? IdCanal { get; init; }
    public string? Canal { get; init; }
    public string? Observacion { get; init; }
    public string? Usuario { get; init; }

    public decimal PrecioUnitario { get; init; }
    public decimal PrecioMayorista { get; init; }
    public decimal PrecioDocena { get; init; }
    public decimal PrecioCosto { get; init; }
    public decimal PrecioCostoBase { get; init; }
    public decimal PrecioCostoDescuento { get; init; }

    public int UnidadesComp { get; init; }
    public int UnidadesBonificadas { get; init; }
    public decimal Descuento1 { get; init; }
    public decimal Descuento2 { get; init; }
    public decimal Descuento3 { get; init; }
    public decimal Descuento4 { get; init; }

    public DateTime? FechaModificacion { get; init; }

    public required IReadOnlyList<PrecioRangoResponse> Rangos { get; init; }
}

public sealed class PrecioRangoResponse
{
    public required int Desde { get; init; }
    public required decimal Precio { get; init; }
}
