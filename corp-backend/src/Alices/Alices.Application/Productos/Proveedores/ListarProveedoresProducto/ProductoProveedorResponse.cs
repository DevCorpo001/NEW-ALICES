namespace Alices.Application.Productos.Proveedores.ListarProveedoresProducto;

public sealed record ProductoProveedorResponse(
    int IdProductoProveedor,
    int IdProducto,
    int IdProveedor,
    string? Ruc,
    string? RazonSocial);
