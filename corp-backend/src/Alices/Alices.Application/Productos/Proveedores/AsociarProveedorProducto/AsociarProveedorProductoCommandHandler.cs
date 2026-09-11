using System.Data;
using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Alices.Domain.Productos;
using Dapper;

namespace Alices.Application.Productos.Proveedores.AsociarProveedorProducto;

internal sealed class AsociarProveedorProductoCommandHandler
    : ICommandHandler<AsociarProveedorProductoCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public AsociarProveedorProductoCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(
        AsociarProveedorProductoCommand request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ID_PRODUCTO", request.IdProducto, DbType.Int32);
        parameters.Add("@ID_PROVEEDOR", request.IdProveedor, DbType.Int32);

        var fila = await connection.QueryFirstOrDefaultAsync(
            "dbo.SP_PRODUCTO_AGREGAR_PROVEEDOR",
            parameters,
            commandType: CommandType.StoredProcedure);

        if (fila is not IDictionary<string, object> valores)
        {
            return Result.Failure(ProductoErrors.ErrorProveedor("No se pudo asociar el proveedor"));
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
                string.IsNullOrWhiteSpace(mensaje) ? "El proveedor ya está asociado a este producto" : mensaje));
        }

        return Result.Success();
    }
}
