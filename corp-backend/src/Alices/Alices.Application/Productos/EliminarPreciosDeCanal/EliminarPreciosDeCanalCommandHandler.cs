using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Alices.Domain.Productos;
using Dapper;
using System.Data;

namespace Alices.Application.Productos.EliminarPreciosDeCanal;

/// <remarks>
/// `sp_EliminarPrecio` borra una sola fila de `PRECIO`, y cada rango por
/// cantidad es su propia fila. Se listan las del canal y se borran todas en
/// una transacción: dejar los rangos sin su fila base descuadraría la ficha.
/// </remarks>
internal sealed class EliminarPreciosDeCanalCommandHandler
    : ICommandHandler<EliminarPreciosDeCanalCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public EliminarPreciosDeCanalCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(
        EliminarPreciosDeCanalCommand request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var listado = new DynamicParameters();
        listado.Add("@idProducto", request.IdProducto, DbType.Int32);

        var filas = await connection.QueryAsync<PrecioDelCanalRow>(
            "dbo.sp_ListarPreciosXProducto",
            listado,
            commandType: CommandType.StoredProcedure);

        var idsPrecio = filas
            .Where(fila => fila.ID_CANAL == request.IdCanal && fila.ID_PRECIO.HasValue)
            .Select(fila => fila.ID_PRECIO!.Value)
            .ToList();

        if (idsPrecio.Count == 0)
        {
            return Result.Failure(ProductoErrors.PrecioNoExiste);
        }

        using var transaction = connection.BeginTransaction();

        foreach (var idPrecio in idsPrecio)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@idprecio", idPrecio, DbType.Int64);

            await connection.ExecuteAsync(
                "dbo.sp_EliminarPrecio",
                parameters,
                transaction: transaction,
                commandType: CommandType.StoredProcedure);
        }

        transaction.Commit();

        return Result.Success();
    }

    private sealed class PrecioDelCanalRow
    {
        public long? ID_PRECIO { get; init; }
        public int? ID_CANAL { get; init; }
    }
}
