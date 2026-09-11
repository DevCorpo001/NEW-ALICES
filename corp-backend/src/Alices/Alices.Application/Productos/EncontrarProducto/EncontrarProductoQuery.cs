using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.EncontrarProducto;

/// <summary>
/// Ficha completa de un producto por su código (`sp_BuscarProducto`).
/// Devuelve lista porque el SP puede traer más de una fila; el consumidor toma
/// la primera.
/// </summary>
public sealed record EncontrarProductoQuery(string CodigoProducto)
    : IQuery<IReadOnlyList<ProductoDetalleResponse>>;
