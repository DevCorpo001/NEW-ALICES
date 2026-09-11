using Alices.Application.Abstractions.Data;
using Alices.Application.Catalogos;

namespace Alices.Application.Lineas;

/// <summary>
/// Proyección directa de las columnas de los SP de línea. Vive aparte del
/// <see cref="LineaResponse"/> para que los nombres en MAYÚSCULAS de la base
/// legacy no se filtren al contrato HTTP.
/// </summary>
internal sealed class LineaRow
{
    public int ID_LINEA { get; init; }
    public string? COD_LINEA { get; init; }
    public string? NOMBRE_LINEA { get; init; }
    public string? ABREVIADO_LINEA { get; init; }

    public LineaResponse AResponse() => new()
    {
        IdLinea = ID_LINEA,
        Codigo = COD_LINEA?.Trim(),
        Nombre = NOMBRE_LINEA?.Trim(),
        Abreviado = ABREVIADO_LINEA?.Trim()
    };
}

internal static class LineaConsultas
{
    public static async Task<IReadOnlyList<LineaResponse>> ListarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        string? codigo,
        string? nombre)
    {
        var filas = await CatalogoSql.ListarAsync<LineaRow>(
            sqlConnectionFactory,
            procedimiento,
            "@codLinea",
            codigo,
            "@nombre_linea",
            nombre);

        return filas.Select(fila => fila.AResponse()).ToList();
    }
}
