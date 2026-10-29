namespace Alices.Application.Marcas;

public sealed class MarcaResponse
{
    public required int IdMarca { get; init; }
    public string? Codigo { get; init; }
    public string? Nombre { get; init; }
}
