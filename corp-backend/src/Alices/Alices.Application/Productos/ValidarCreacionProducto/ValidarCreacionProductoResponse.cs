namespace Alices.Application.Productos.ValidarCreacionProducto;

public sealed class ValidarCreacionProductoResponse
{
    public required bool ExisteCodigo { get; init; }
    public required bool ExisteBarra { get; init; }
}
