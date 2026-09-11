using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Categorias.ListarCategoriaAuto;

/// <summary>Sugerencias para los buscadores de categoría (`sp_ListarCategoria_Auto`).</summary>
public sealed record ListarCategoriaAutoQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<CategoriaResponse>>;
