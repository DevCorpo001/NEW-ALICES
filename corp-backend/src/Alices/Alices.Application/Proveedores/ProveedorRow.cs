using System.Data;
using Alices.Application.Abstractions.Data;
using Alices.Application.Catalogos;
using Dapper;

namespace Alices.Application.Proveedores;

internal sealed class ProveedorRow
{
    public int ID_PROVEEDOR { get; init; }
    public string? RUC { get; init; }
    public string? RAZ_SOC { get; init; }
    public string? NCOMERCIAL { get; init; }
    public string? DIRECCION { get; init; }

    /// <summary>
    /// Nullable a propósito: el sistema anterior hacía `Convert.ToDateTime` sin
    /// comprobar nulos y reventaba si la columna venía vacía.
    /// </summary>
    public DateTime? FEC_REG { get; init; }

    public ProveedorResponse AResponse() => new()
    {
        IdProveedor = ID_PROVEEDOR,
        Ruc = RUC?.Trim(),
        RazonSocial = RAZ_SOC?.Trim(),
        NombreComercial = NCOMERCIAL?.Trim(),
        Direccion = DIRECCION?.Trim(),
        FechaRegistro = FEC_REG
    };
}

internal static class ProveedorConsultas
{
    public static async Task<IReadOnlyList<ProveedorResponse>> ListarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        string? ruc,
        string? razonSocial)
    {
        var filas = await CatalogoSql.ListarAsync<ProveedorRow>(
            sqlConnectionFactory,
            procedimiento,
            "@ruc",
            ruc,
            "@razon_social",
            razonSocial);

        return filas.Select(fila => fila.AResponse()).ToList();
    }

    public static async Task<IReadOnlyList<ProveedorResponse>> BuscarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string? ruc,
        string? razonSocial,
        string? criterio = null,
        int limite = 200)
    {
        using var connection = sqlConnectionFactory.CreateConnection();

        const string sql = """
            SELECT TOP (@limite)
                ID_PROVEEDOR,
                TRIM(RUC) AS RUC,
                TRIM(RAZ_SOC) AS RAZ_SOC,
                NCOMERCIAL,
                DIRECCION,
                FEC_REG
            FROM PROVEEDOR
            WHERE (@ruc IS NULL OR RUC LIKE '%' + @ruc + '%')
              AND (@razonSocial IS NULL OR RAZ_SOC LIKE '%' + @razonSocial + '%')
              AND (@criterio IS NULL OR RUC LIKE '%' + @criterio + '%' OR RAZ_SOC LIKE '%' + @criterio + '%' OR NCOMERCIAL LIKE '%' + @criterio + '%')
            ORDER BY RAZ_SOC
            """;

        var parameters = new DynamicParameters();
        parameters.Add("@limite", limite, DbType.Int32);
        parameters.Add("@ruc", CatalogoSql.Normalizar(ruc), DbType.AnsiString);
        parameters.Add("@razonSocial", CatalogoSql.Normalizar(razonSocial), DbType.AnsiString);
        parameters.Add("@criterio", CatalogoSql.Normalizar(criterio), DbType.AnsiString);

        var filas = await connection.QueryAsync<ProveedorRow>(sql, parameters);
        return filas.Select(fila => fila.AResponse()).ToList();
    }
}
