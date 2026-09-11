namespace Alices.Application.Categorias;

public sealed class CategoriaResponse
{
    public required int IdCategoria { get; init; }
    public string? Codigo { get; init; }
    public string? Nombre { get; init; }
}
