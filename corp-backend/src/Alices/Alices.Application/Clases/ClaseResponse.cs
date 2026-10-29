namespace Alices.Application.Clases;

public sealed class ClaseResponse
{
    public required int IdClase { get; init; }
    public string? Codigo { get; init; }
    public string? Nombre { get; init; }
    public string? NombreCorto { get; init; }
    public string? CodigoLinea { get; init; }
    public string? CodigoFamilia { get; init; }
}
