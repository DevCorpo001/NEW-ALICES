namespace Alices.Application.Productos.Almacenes.ListarStockAlmacenPorPrecio;

public sealed class StockAlmacenResponse
{
    public required int IdAlmacen { get; init; }
    public required string DescripcionAlmacen { get; init; }
    public decimal Cantidad { get; init; }
}
