using Alices.Application.Abstractions.Data;
using Alices.Application.Catalogos;

namespace Alices.Application.Marcas;

internal sealed class MarcaRow
{
    public int ID_MARCA { get; init; }
    public string? COD_MARCA { get; init; }
    public string? NOMBRE_MARCA { get; init; }

    public MarcaResponse AResponse() => new()
    {
        IdMarca = ID_MARCA,
        Codigo = COD_MARCA?.Trim() ?? string.Empty,
        Nombre = NOMBRE_MARCA?.Trim() ?? string.Empty
    };
}

internal static class MarcaConsultas
{
    public static async Task<IReadOnlyList<MarcaResponse>> ListarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        string? codigo,
        string? nombre)
    {
        var filas = await CatalogoSql.ListarAsync<MarcaRow>(
            sqlConnectionFactory,
            procedimiento,
            "@CodMarca",
            codigo,
            "@NombreMarca",
            nombre);

        return filas.Select(fila => fila.AResponse()).ToList();
    }
}
