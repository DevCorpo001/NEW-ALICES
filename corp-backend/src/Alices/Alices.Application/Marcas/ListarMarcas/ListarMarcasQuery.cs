using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Marcas.ListarMarcas;

/// <summary>Listado de marcas (`sp_ListarMarca`). Sin filtros devuelve todas.</summary>
public sealed record ListarMarcasQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<MarcaResponse>>;
