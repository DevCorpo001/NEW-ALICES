using Alices.Application.Abstractions.Data;
using Alices.Application.Productos.EncontrarProducto;
using Dapper;
using System.Data;

namespace Alices.Application.Productos;

/// <summary>
/// Lectura de la ficha de producto (`sp_BuscarProducto`).
///
/// La comparten la consulta del buscador y el comando de actualización, que
/// relee el producto para devolver lo que realmente quedó guardado.
/// </summary>
internal static class ProductoConsultas
{
    public static async Task<IReadOnlyList<ProductoDetalleResponse>> BuscarPorCodigoAsync(
        ISqlConnectionFactory sqlConnectionFactory,
        string codigo)
    {
        using var connection = sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@CodigoProd", codigo.Trim(), DbType.AnsiString);

        var filas = (await connection.QueryAsync<ProductoDetalleRow>(
            "dbo.sp_BuscarProducto",
            parameters,
            commandType: CommandType.StoredProcedure)).ToList();

        if (filas.Count == 0)
        {
            return Array.Empty<ProductoDetalleResponse>();
        }

        var idProducto = filas[0].ID_PRODUCTO;
        string? imagen = null;
        if (idProducto.HasValue)
        {
            var pImg = new DynamicParameters();
            pImg.Add("@idProducto", idProducto.Value, DbType.Int32);
            imagen = await connection.QueryFirstOrDefaultAsync<string>(
                "SELECT IMAGEN FROM PRODUCTO WHERE ID_PRODUCTO = @idProducto",
                pImg);
        }

        return filas.Select(fila => fila.AResponse(imagen)).ToList();
    }
}
