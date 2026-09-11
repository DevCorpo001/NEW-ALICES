using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.ListarCodigosBarra;

/// <summary>Códigos de barra de un producto (`sp_ListarCodigosBarra`).</summary>
public sealed record ListarCodigosBarraQuery(int IdProducto)
    : IQuery<IReadOnlyList<CodigoBarraResponse>>;
