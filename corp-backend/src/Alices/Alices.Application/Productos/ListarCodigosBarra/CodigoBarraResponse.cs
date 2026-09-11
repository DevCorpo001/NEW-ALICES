namespace Alices.Application.Productos.ListarCodigosBarra;

public sealed class CodigoBarraResponse
{
    public required int IdBarra { get; init; }
    public string? Codigo { get; init; }
}
