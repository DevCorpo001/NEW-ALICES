using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Familias.ListarFamilias;

/// <summary>Listado de familias (`sp_ListarFamilia`). Sin filtros devuelve todas.</summary>
public sealed record ListarFamiliasQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<FamiliaResponse>>;
