using Alices.Application.Abstractions.Data;
using Alices.Application.Catalogos;

namespace Alices.Application.Clases;

internal sealed class ClaseRow
{
    public int ID_CLASE { get; init; }
    public string? COD_CLASE { get; init; }
    public string? NOMBRE_CLASE { get; init; }
    public string? NOMB_CORTO { get; init; }
    public string? COD_LINEA { get; init; }
    public string? COD_FAMILIA { get; init; }

    public ClaseResponse AResponse() => new()
    {
        IdClase = ID_CLASE,
        Codigo = COD_CLASE?.Trim(),
        Nombre = NOMBRE_CLASE?.Trim(),
        NombreCorto = NOMB_CORTO?.Trim(),
        CodigoLinea = COD_LINEA?.Trim(),
        CodigoFamilia = COD_FAMILIA?.Trim()
    };
}

internal static class ClaseConsultas
{
    public static async Task<IReadOnlyList<ClaseResponse>> ListarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        string? codigo,
        string? nombre)
    {
        var filas = await CatalogoSql.ListarAsync<ClaseRow>(
            sqlConnectionFactory,
            procedimiento,
            "@codClase",
            codigo,
            "@nombre_clase",
            nombre);

        return filas.Select(fila => fila.AResponse()).ToList();
    }
}
