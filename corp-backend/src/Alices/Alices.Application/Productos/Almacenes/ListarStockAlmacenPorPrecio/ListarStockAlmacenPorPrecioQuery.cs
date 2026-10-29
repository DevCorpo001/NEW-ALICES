using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.Almacenes.ListarStockAlmacenPorPrecio;

public sealed record ListarStockAlmacenPorPrecioQuery(int IdPrecio)
    : IQuery<IReadOnlyList<StockAlmacenResponse>>;
