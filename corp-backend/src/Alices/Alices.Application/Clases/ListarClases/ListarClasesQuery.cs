using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Clases.ListarClases;

/// <summary>Listado de clases (`sp_ListarClase`). Sin filtros devuelve todas.</summary>
public sealed record ListarClasesQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<ClaseResponse>>;
