using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;
using System.Data;

namespace Alices.Application.Productos.ListarCodigosBarra;

internal sealed class ListarCodigosBarraQueryHandler
    : IQueryHandler<ListarCodigosBarraQuery, IReadOnlyList<CodigoBarraResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarCodigosBarraQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<CodigoBarraResponse>>> Handle(
        ListarCodigosBarraQuery request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@idProducto", request.IdProducto, DbType.Int32);

        var filas = await connection.QueryAsync<BarraRow>(
            "dbo.sp_ListarCodigosBarra",
            parameters,
            commandType: CommandType.StoredProcedure);

        var codigos = filas
            .Select(fila => new CodigoBarraResponse
            {
                IdBarra = fila.ID_BARRA ?? 0,
                // Las columnas CHAR llegan con relleno de espacios.
                Codigo = fila.BARRA?.Trim()
            })
            .ToList();

        return Result.Success<IReadOnlyList<CodigoBarraResponse>>(codigos);
    }

    private sealed class BarraRow
    {
        public int? ID_BARRA { get; init; }
        public string? BARRA { get; init; }
    }
}
