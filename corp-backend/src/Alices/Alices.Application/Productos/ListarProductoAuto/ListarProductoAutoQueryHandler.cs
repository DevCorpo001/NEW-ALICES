using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;
using System.Data;

namespace Alices.Application.Productos.ListarProductoAuto;

internal sealed class ListarProductoAutoQueryHandler
    : IQueryHandler<ListarProductoAutoQuery, IReadOnlyList<ProductoAutoResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarProductoAutoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<ProductoAutoResponse>>> Handle(
        ListarProductoAutoQuery request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@busqueda", request.Busqueda, DbType.AnsiString, ParameterDirection.Input, 100);
        parameters.Add("@estado", request.Estado, DbType.AnsiString, ParameterDirection.Input, 20);

        var rows = (await connection.QueryAsync<ProductoAutoRow>(
            "dbo.sp_ListarProducto_Auto",
            parameters,
            commandType: CommandType.StoredProcedure)).AsList();

        var productos = rows.Select(producto => new ProductoAutoResponse
        {
            IdProducto = producto.ID_PRODUCTO,
            CodigoProducto = producto.COD_PRODUCTO,
            Descripcion = producto.DESC_PRODUCTO,
            Estado = producto.ESTADO
        }).ToList();

        return Result.Success<IReadOnlyList<ProductoAutoResponse>>(productos);
    }

    private sealed class ProductoAutoRow
    {
        public int ID_PRODUCTO { get; init; }
        public string? COD_PRODUCTO { get; init; }
        public string? DESC_PRODUCTO { get; init; }
        public string? ESTADO { get; init; }
    }
}
