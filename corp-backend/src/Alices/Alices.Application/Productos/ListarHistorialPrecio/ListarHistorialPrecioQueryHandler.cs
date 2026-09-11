using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;
using System.Data;

namespace Alices.Application.Productos.ListarHistorialPrecio;

/// <summary>
/// El SP resuelve producto y canal a partir del id de precio y devuelve los
/// movimientos del más reciente al más antiguo; aquí solo se traducen nombres.
/// </summary>
internal sealed class ListarHistorialPrecioQueryHandler
    : IQueryHandler<ListarHistorialPrecioQuery, IReadOnlyList<CambioPrecioResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarHistorialPrecioQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<CambioPrecioResponse>>> Handle(
        ListarHistorialPrecioQuery request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ID_PRECIO", request.IdPrecio, DbType.Int32);

        var filas = await connection.QueryAsync<CambioPrecioRow>(
            "dbo.SP_ALMACEN_PRECIO_LOG_POR_PRECIO",
            parameters,
            commandType: CommandType.StoredProcedure);

        var cambios = filas
            .Select(fila => new CambioPrecioResponse
            {
                IdCambio = fila.LOG_ID,
                Fecha = fila.LOG_DATE,
                Tipo = fila.LOG_TYPE?.Trim(),
                Usuario = fila.USUARIO?.Trim(),
                Desde = fila.UNIDADES_MINIMAS,
                PrecioUnitario = fila.PRECIO_UNITARIO,
                UnidadesComp = fila.UND_COMP,
                UnidadesBonificadas = fila.UND_BNF,
                Descuento1 = fila.DESC1,
                Descuento2 = fila.DESC2
            })
            .ToList();

        return Result.Success<IReadOnlyList<CambioPrecioResponse>>(cambios);
    }

    private sealed class CambioPrecioRow
    {
        public long LOG_ID { get; init; }
        public DateTime? LOG_DATE { get; init; }
        public string? LOG_TYPE { get; init; }
        public string? USUARIO { get; init; }
        public int? UNIDADES_MINIMAS { get; init; }
        public decimal? PRECIO_UNITARIO { get; init; }
        public int? UND_COMP { get; init; }
        public int? UND_BNF { get; init; }
        public decimal? DESC1 { get; init; }
        public decimal? DESC2 { get; init; }
    }
}
