using System.Data;
using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;

namespace Alices.Application.Productos.Almacenes.ListarStockAlmacenPorPrecio;

internal sealed class ListarStockAlmacenPorPrecioQueryHandler
    : IQueryHandler<ListarStockAlmacenPorPrecioQuery, IReadOnlyList<StockAlmacenResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarStockAlmacenPorPrecioQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<StockAlmacenResponse>>> Handle(
        ListarStockAlmacenPorPrecioQuery request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@idprecio", request.IdPrecio, DbType.Int32);

        var filas = await connection.QueryAsync<StockAlmacenRow>(
            "dbo.sp_ListarAlmacenPorPrecio",
            parameters,
            commandType: CommandType.StoredProcedure);

        var respuesta = filas.Select(fila => new StockAlmacenResponse
        {
            IdAlmacen = fila.ID_ALMACEN ?? 0,
            DescripcionAlmacen = fila.DESC_ALMACEN?.Trim() ?? string.Empty,
            Cantidad = fila.CANTIDAD ?? 0m
        }).ToList();

        return Result.Success<IReadOnlyList<StockAlmacenResponse>>(respuesta);
    }
}

internal sealed class StockAlmacenRow
{
    public int? ID_ALMACEN { get; init; }
    public string? DESC_ALMACEN { get; init; }
    public decimal? CANTIDAD { get; init; }
}
