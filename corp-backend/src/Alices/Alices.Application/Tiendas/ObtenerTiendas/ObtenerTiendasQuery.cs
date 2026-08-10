using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Tiendas.ObtenerTiendas;

public sealed record ObtenerTiendasQuery : IQuery<IReadOnlyList<TiendaResponse>>;
