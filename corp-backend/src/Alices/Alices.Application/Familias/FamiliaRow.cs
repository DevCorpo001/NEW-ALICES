using Alices.Application.Abstractions.Data;
using Alices.Application.Catalogos;

namespace Alices.Application.Familias;

internal sealed class FamiliaRow
{
    public int ID_FAMILIA { get; init; }
    public string? COD_FAMILIA { get; init; }
    public string? NOMBRE_FAMILIA { get; init; }
    public string? ABREVIADO_FAMILIA { get; init; }

    public FamiliaResponse AResponse() => new()
    {
        IdFamilia = ID_FAMILIA,
        Codigo = COD_FAMILIA?.Trim(),
        Nombre = NOMBRE_FAMILIA?.Trim(),
        Abreviado = ABREVIADO_FAMILIA?.Trim()
    };
}

internal static class FamiliaConsultas
{
    public static async Task<IReadOnlyList<FamiliaResponse>> ListarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        string? codigo,
        string? nombre)
    {
        var filas = await CatalogoSql.ListarAsync<FamiliaRow>(
            sqlConnectionFactory,
            procedimiento,
            "@codFamilia",
            codigo,
            "@nombre_familia",
            nombre);

        return filas.Select(fila => fila.AResponse()).ToList();
    }
}
