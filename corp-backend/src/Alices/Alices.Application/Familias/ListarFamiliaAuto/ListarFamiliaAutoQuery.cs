using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Familias.ListarFamiliaAuto;

/// <summary>Sugerencias para los buscadores de familia (`sp_ListarFamilia_Auto`).</summary>
public sealed record ListarFamiliaAutoQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<FamiliaResponse>>;
