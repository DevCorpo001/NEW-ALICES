using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.Proveedores.ListarProveedoresProducto;

public sealed record ListarProveedoresProductoQuery(int IdProducto)
    : IQuery<IReadOnlyList<ProductoProveedorResponse>>;
