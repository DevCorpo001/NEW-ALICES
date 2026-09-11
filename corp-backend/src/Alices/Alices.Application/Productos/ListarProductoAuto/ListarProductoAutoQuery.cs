using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.ListarProductoAuto;

public sealed record ListarProductoAutoQuery(
    string? Busqueda,
    string? Estado) : IQuery<IReadOnlyList<ProductoAutoResponse>>;
