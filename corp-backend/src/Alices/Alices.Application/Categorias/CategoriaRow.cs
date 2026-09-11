using Alices.Application.Abstractions.Data;
using Alices.Application.Catalogos;

namespace Alices.Application.Categorias;

internal sealed class CategoriaRow
{
    public int ID_CATEGORIA { get; init; }
    public string? COD_CATEGORIA { get; init; }
    public string? NOMBRE_CATEGORIA { get; init; }

    public CategoriaResponse AResponse() => new()
    {
        IdCategoria = ID_CATEGORIA,
        Codigo = COD_CATEGORIA?.Trim(),
        Nombre = NOMBRE_CATEGORIA?.Trim()
    };
}

internal static class CategoriaConsultas
{
    public static async Task<IReadOnlyList<CategoriaResponse>> ListarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        string? codigo,
        string? nombre)
    {
        var filas = await CatalogoSql.ListarAsync<CategoriaRow>(
            sqlConnectionFactory,
            procedimiento,
            "@CodCategoria",
            codigo,
            "@NombreCategoria",
            nombre);

        return filas.Select(fila => fila.AResponse()).ToList();
    }
}
