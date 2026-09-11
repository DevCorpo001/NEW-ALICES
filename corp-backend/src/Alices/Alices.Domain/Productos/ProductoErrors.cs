using Alices.Domain.Abstractions;

namespace Alices.Domain.Productos;

public static class ProductoErrors
{
    public static readonly Error CodigoYaExiste = new(
        "Producto.CodigoYaExiste",
        "El código del producto ya existe");

    public static readonly Error BarraYaExiste = new(
        "Producto.BarraYaExiste",
        "El código de barras ya existe");

    /// <summary>
    /// La actualización relee el producto para confirmar que quedó guardado.
    /// Si no aparece, el SP no llegó a modificar nada.
    /// </summary>
    public static readonly Error NoEncontrado = new(
        "Producto.NoEncontrado",
        "No se encontró el producto después de actualizarlo");

    public static readonly Error PrecioNoExiste = new(
        "Producto.PrecioNoExiste",
        "El producto no tiene precios registrados en ese canal");

    public static readonly Error ProveedorYaAsociado = new(
        "Producto.ProveedorYaAsociado",
        "El proveedor ya está asociado a este producto");

    public static Error ErrorProveedor(string mensaje) => new(
        "Producto.ErrorProveedor",
        mensaje);
}
