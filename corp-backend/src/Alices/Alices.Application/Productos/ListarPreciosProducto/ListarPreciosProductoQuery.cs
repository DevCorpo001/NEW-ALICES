using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.ListarPreciosProducto;

/// <summary>Lista de precios de un producto (`sp_ListarPreciosXProducto`).</summary>
public sealed record ListarPreciosProductoQuery(int IdProducto)
    : IQuery<IReadOnlyList<PrecioProductoResponse>>;
