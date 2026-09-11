namespace Alices.Application.Lineas;

/// <summary>
/// Fila de línea tal como la devuelven `sp_ListarLinea` y `sp_ListarLinea_Auto`.
/// Compartida por ambas consultas porque el contrato es el mismo.
/// </summary>
public sealed class LineaResponse
{
    public required int IdLinea { get; init; }
    public string? Codigo { get; init; }
    public string? Nombre { get; init; }
    public string? Abreviado { get; init; }
}
