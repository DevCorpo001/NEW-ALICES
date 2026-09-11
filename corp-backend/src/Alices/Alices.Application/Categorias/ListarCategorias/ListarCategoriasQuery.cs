using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Categorias.ListarCategorias;

/// <summary>Listado de categorías (`sp_ListarCategoria`). Sin filtros devuelve todas.</summary>
public sealed record ListarCategoriasQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<CategoriaResponse>>;
