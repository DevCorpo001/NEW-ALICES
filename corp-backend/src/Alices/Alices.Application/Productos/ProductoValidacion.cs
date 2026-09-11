using Alices.Application.Abstractions.Data;
using Dapper;
using System.Data;

namespace Alices.Application.Productos;

/// <summary>
/// Comprobación de unicidad de producto contra `sp_ValidarCreacionProducto`.
///
/// La comparten la consulta que usa el modal de códigos de barra y los
/// comandos de alta y actualización, para que la regla viva en un solo sitio.
/// </summary>
internal static class ProductoValidacion
{
    public static async Task<(bool ExisteCodigo, bool ExisteBarra)> ComprobarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string? codigo,
        int? idProducto,
        string? codigoBarra)
    {
        using var connection = sqlConnectionFactory.CreateConnection();

        // Sin `size` explícito para no truncar valores más largos de lo previsto.
        var parameters = new DynamicParameters();
        parameters.Add("@CODIGO", Normalizar(codigo), DbType.AnsiString);
        parameters.Add("@IDPROD", idProducto, DbType.Int32);
        parameters.Add("@BARRA", Normalizar(codigoBarra), DbType.AnsiString);

        // Se lee como diccionario para aceptar tanto BIT como INT, igual que
        // hacía el sistema anterior con Convert.ToBoolean.
        var fila = await connection.QueryFirstOrDefaultAsync(
            "dbo.sp_ValidarCreacionProducto",
            parameters,
            commandType: CommandType.StoredProcedure);

        if (fila is not IDictionary<string, object> valores)
        {
            return (false, false);
        }

        return (LeerBooleano(valores, "EXISTE_CODIGO"), LeerBooleano(valores, "EXISTE_BARRA"));
    }

    public static string? Normalizar(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    private static bool LeerBooleano(IDictionary<string, object> fila, string columna)
    {
        if (!fila.TryGetValue(columna, out var valor) || valor is null || valor is DBNull)
        {
            return false;
        }

        return Convert.ToBoolean(valor);
    }
}
