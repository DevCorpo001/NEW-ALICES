using Alices.Application.Abstractions.Data;
using Dapper;
using System.Data;

namespace Alices.Application.Catalogos;

/// <summary>
/// Fontanería común de los catálogos maestros (línea, familia, clase, marca,
/// categoría, proveedor).
///
/// Todos siguen el mismo par de stored procedures —listado y autocompletado—
/// con dos parámetros de filtro, aunque cada uno los nombre a su manera
/// (`@codLinea`/`@nombre_linea`, `@CodMarca`/`@NombreMarca`, `@ruc`/`@razon_social`…),
/// por eso los nombres se pasan como argumento.
/// </summary>
internal static class CatalogoSql
{
    public static async Task<IReadOnlyList<TRow>> ListarAsync<TRow>(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        string parametroCodigo,
        string? codigo,
        string parametroNombre,
        string? nombre)
    {
        using var connection = sqlConnectionFactory.CreateConnection();

        // Sin `size` explícito para no truncar valores más largos de lo previsto.
        var parameters = new DynamicParameters();
        parameters.Add(parametroCodigo, Normalizar(codigo), DbType.AnsiString);
        parameters.Add(parametroNombre, Normalizar(nombre), DbType.AnsiString);

        var filas = await connection.QueryAsync<TRow>(
            procedimiento,
            parameters,
            commandType: CommandType.StoredProcedure);

        return filas.ToList();
    }

    public static async Task EjecutarAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        DynamicParameters parameters)
    {
        using var connection = sqlConnectionFactory.CreateConnection();
        await connection.ExecuteAsync(procedimiento, parameters, commandType: CommandType.StoredProcedure);
    }

    /// <summary>
    /// Ejecuta un SP de alta que valida por su cuenta y devuelve una fila
    /// `RESULTADO` / `MENSAJE` (es el caso de marca y categoría).
    /// </summary>
    public static async Task<(bool Resultado, string Mensaje)> EjecutarConResultadoAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string procedimiento,
        DynamicParameters parameters)
    {
        using var connection = sqlConnectionFactory.CreateConnection();

        var fila = await connection.QueryFirstOrDefaultAsync(
            procedimiento,
            parameters,
            commandType: CommandType.StoredProcedure);

        if (fila is not IDictionary<string, object> valores)
        {
            return (false, "Error al ejecutar la operación");
        }

        // Se lee por diccionario para aceptar BIT o INT en RESULTADO, igual que
        // hacía el sistema anterior con Convert.ToBoolean.
        var resultado = valores.TryGetValue("RESULTADO", out var valor)
            && valor is not null
            && valor is not DBNull
            && Convert.ToBoolean(valor);

        var mensaje = valores.TryGetValue("MENSAJE", out var texto) && texto is not null and not DBNull
            ? texto.ToString() ?? string.Empty
            : string.Empty;

        return (resultado, mensaje);
    }

    public static string? Normalizar(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
}
