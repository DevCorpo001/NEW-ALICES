using System.Data;
using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;

namespace Alices.Application.Productos.Almacenes.ActualizarStockAlmacen;

internal sealed class ActualizarStockAlmacenCommandHandler
    : ICommandHandler<ActualizarStockAlmacenCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ActualizarStockAlmacenCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(
        ActualizarStockAlmacenCommand request,
        CancellationToken cancellationToken)
    {
        if (request.Ajustes is null || request.Ajustes.Count == 0)
        {
            return Result.Success();
        }

        using var connection = _sqlConnectionFactory.CreateConnection();
        using var transaction = connection.BeginTransaction();

        try
        {
            foreach (var ajuste in request.Ajustes)
            {
                var operacion = ajuste.Operacion.ToLowerInvariant().Trim();
                if (operacion != "sumar" && operacion != "actualizar")
                {
                    continue;
                }

                var parameters = new DynamicParameters();
                parameters.Add("@cantidad", ajuste.Cantidad, DbType.Int32);
                parameters.Add("@idalmacen", ajuste.IdAlmacen, DbType.Int16);
                parameters.Add("@idprecio", request.IdPrecio, DbType.Int64);
                parameters.Add("@operacion", operacion, DbType.String, size: 10);

                await connection.ExecuteAsync(
                    "dbo.sp_Actualizar_PrecioxAlmacen",
                    parameters,
                    transaction: transaction,
                    commandType: CommandType.StoredProcedure);
            }

            transaction.Commit();
            return Result.Success();
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return Result.Failure(new Error("StockAlmacen.ErrorAlActualizar", ex.Message));
        }
    }
}
