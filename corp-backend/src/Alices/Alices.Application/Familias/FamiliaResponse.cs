namespace Alices.Application.Familias;

public sealed class FamiliaResponse
{
    public required int IdFamilia { get; init; }
    public string? Codigo { get; init; }
    public string? Nombre { get; init; }
    public string? Abreviado { get; init; }
}
