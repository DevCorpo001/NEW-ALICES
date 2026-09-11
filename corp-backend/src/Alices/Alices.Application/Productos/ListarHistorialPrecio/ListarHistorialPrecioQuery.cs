using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.ListarHistorialPrecio;

/// <summary>Historial de cambios de un precio (`SP_ALMACEN_PRECIO_LOG_POR_PRECIO`).</summary>
public sealed record ListarHistorialPrecioQuery(int IdPrecio)
    : IQuery<IReadOnlyList<CambioPrecioResponse>>;
