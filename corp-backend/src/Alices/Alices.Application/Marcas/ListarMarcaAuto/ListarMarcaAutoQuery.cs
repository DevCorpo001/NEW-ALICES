using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Marcas.ListarMarcaAuto;

/// <summary>Sugerencias para los buscadores de marca (`sp_ListarMarca_Auto`).</summary>
public sealed record ListarMarcaAutoQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<MarcaResponse>>;
