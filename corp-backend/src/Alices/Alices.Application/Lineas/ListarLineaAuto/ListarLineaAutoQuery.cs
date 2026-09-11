using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Lineas.ListarLineaAuto;

/// <summary>Sugerencias para los buscadores de línea (`sp_ListarLinea_Auto`).</summary>
public sealed record ListarLineaAutoQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<LineaResponse>>;
