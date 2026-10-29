using System.Data;
using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;

namespace Alices.Application.Productos.Proveedores.ListarProveedoresProducto;

internal sealed class ProductoProveedorRow
{
    public int ID_PRODUCTO_PROVEEDOR { get; init; }
    public int ID_PRODUCTO { get; init; }
    public int ID_PROVEEDOR { get; init; }
    public string? RUC { get; init; }
    public string? RAZ_SOC { get; init; }

    public ProductoProveedorResponse ToResponse() => new(
        ID_PRODUCTO_PROVEEDOR,
        ID_PRODUCTO,
        ID_PROVEEDOR,
        RUC?.Trim(),
        RAZ_SOC?.Trim());
}

internal sealed class ListarProveedoresProductoQueryHandler
    : IQueryHandler<ListarProveedoresProductoQuery, IReadOnlyList<ProductoProveedorResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarProveedoresProductoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<ProductoProveedorResponse>>> Handle(
        ListarProveedoresProductoQuery request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ID_PRODUCTO", request.IdProducto, DbType.Int32);

        var rows = await connection.QueryAsync<ProductoProveedorRow>(
            "dbo.SP_PRODUCTO_LISTAR_PROVEEDORES",
            parameters,
            commandType: CommandType.StoredProcedure);

        var result = rows.Select(r => r.ToResponse()).ToList();
        return Result.Success<IReadOnlyList<ProductoProveedorResponse>>(result);
    }
}
