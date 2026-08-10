using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;

namespace Alices.Application.Tiendas.ObtenerTiendas;

internal sealed class ObtenerTiendasQueryHandler
    : IQueryHandler<ObtenerTiendasQuery, IReadOnlyList<TiendaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ObtenerTiendasQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<TiendaResponse>>> Handle(
        ObtenerTiendasQuery request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        const string sql = """
            SELECT
                id_tienda AS IdTienda,
                cod_tienda AS CodigoTienda,
                direccion AS Direccion
            FROM TIENDA
            WHERE eliminado = 0
            ORDER BY cod_tienda
            """;

        var tiendas = (await connection.QueryAsync<TiendaResponse>(sql)).AsList();
        return Result.Success<IReadOnlyList<TiendaResponse>>(tiendas);
    }
}
