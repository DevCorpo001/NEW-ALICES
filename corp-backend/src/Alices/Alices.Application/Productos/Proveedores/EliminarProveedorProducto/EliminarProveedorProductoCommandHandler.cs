using System.Data;
using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Alices.Domain.Productos;
using Dapper;

namespace Alices.Application.Productos.Proveedores.EliminarProveedorProducto;

internal sealed class EliminarProveedorProductoCommandHandler
    : ICommandHandler<EliminarProveedorProductoCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public EliminarProveedorProductoCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(
        EliminarProveedorProductoCommand request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ID_PRODUCTO_PROVEEDOR", request.IdProductoProveedor, DbType.Int32);

        var fila = await connection.QueryFirstOrDefaultAsync(
            "dbo.SP_PRODUCTO_ELIMINAR_PROVEEDOR",
            parameters,
            commandType: CommandType.StoredProcedure);

        if (fila is not IDictionary<string, object> valores)
        {
            return Result.Failure(ProductoErrors.ErrorProveedor("No se pudo eliminar el registro"));
        }

        var resultado = valores.TryGetValue("Resultado", out var valor)
            && valor is not null
            && valor is not DBNull
            && Convert.ToBoolean(valor);

        var mensaje = valores.TryGetValue("Mensaje", out var texto) && texto is not null and not DBNull
            ? texto.ToString() ?? string.Empty
            : string.Empty;

        if (!resultado)
        {
            return Result.Failure(ProductoErrors.ErrorProveedor(
                string.IsNullOrWhiteSpace(mensaje) ? "No se pudo desvincular el proveedor" : mensaje));
        }

        return Result.Success();
    }
}
