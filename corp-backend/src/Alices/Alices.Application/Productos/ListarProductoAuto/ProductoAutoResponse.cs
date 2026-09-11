namespace Alices.Application.Productos.ListarProductoAuto;

public sealed class ProductoAutoResponse
{
    public required int IdProducto { get; init; }
    public string? CodigoProducto { get; init; }
    public string? Descripcion { get; init; }
    public string? Estado { get; init; }
}
