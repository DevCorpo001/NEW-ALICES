using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;
using System.Data;

namespace Alices.Application.Productos.ListarPreciosProducto;

/// <summary>
/// El SP devuelve una fila por canal y unidad mínima. Se agrupa por canal: la
/// primera fila del canal aporta los datos base y las filas con
/// `UNIDADES_MINIMAS > 1` se convierten en rangos por cantidad.
/// </summary>
internal sealed class ListarPreciosProductoQueryHandler
    : IQueryHandler<ListarPreciosProductoQuery, IReadOnlyList<PrecioProductoResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarPreciosProductoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<PrecioProductoResponse>>> Handle(
        ListarPreciosProductoQuery request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@idProducto", request.IdProducto, DbType.Int32);

        var filas = (await connection.QueryAsync<PrecioRow>(
            "dbo.sp_ListarPreciosXProducto",
            parameters,
            commandType: CommandType.StoredProcedure)).ToList();

        var precios = new List<PrecioProductoResponse>();

        foreach (var grupo in filas.GroupBy(fila => fila.ID_CANAL))
        {
            var baseFila = grupo.First();

            var rangos = grupo
                .Where(fila => (fila.UNIDADES_MINIMAS ?? 1) > 1)
                .Select(fila => new PrecioRangoResponse
                {
                    Desde = fila.UNIDADES_MINIMAS ?? 1,
                    Precio = fila.PRECIO_UNITARIO ?? 0m
                })
                .ToList();

            precios.Add(new PrecioProductoResponse
            {
                IdPrecio = baseFila.ID_PRECIO ?? 0,
                IdProducto = request.IdProducto,
                IdGrupo = baseFila.ID_GRUPO ?? 0,
                NombreGrupo = baseFila.NOMBRE_GRUPO?.Trim(),
                IdCanal = baseFila.ID_CANAL,
                Canal = baseFila.CANAL?.Trim(),
                Observacion = baseFila.OBSERVACION?.Trim(),
                Usuario = baseFila.USUARIO?.Trim(),
                PrecioUnitario = baseFila.PRECIO_UNITARIO ?? 0m,
                PrecioMayorista = baseFila.PRECIO_MAYORISTA ?? 0m,
                PrecioDocena = baseFila.PRECIO_DOCENA ?? 0m,
                PrecioCosto = baseFila.COSTO ?? 0m,
                PrecioCostoBase = baseFila.COSTO_BASE ?? 0m,
                PrecioCostoDescuento = baseFila.COSTO_DESCUENTO ?? 0m,
                UnidadesComp = baseFila.UND_COMP ?? 0,
                UnidadesBonificadas = baseFila.UND_BNF ?? 0,
                Descuento1 = baseFila.DESC1 ?? 0m,
                Descuento2 = baseFila.DESC2 ?? 0m,
                Descuento3 = baseFila.DESC3 ?? 0m,
                Descuento4 = baseFila.DESC4 ?? 0m,
                FechaModificacion = baseFila.FEC_MODIF,
                Rangos = rangos
            });
        }

        return Result.Success<IReadOnlyList<PrecioProductoResponse>>(precios);
    }

    private sealed class PrecioRow
    {
        public int? ID_PRECIO { get; init; }
        public int? ID_GRUPO { get; init; }
        public string? NOMBRE_GRUPO { get; init; }
        public int? ID_CANAL { get; init; }
        public string? CANAL { get; init; }
        public decimal? COSTO_BASE { get; init; }
        public decimal? COSTO { get; init; }
        public decimal? COSTO_DESCUENTO { get; init; }
        public int? UND_COMP { get; init; }
        public int? UND_BNF { get; init; }
        public DateTime? FEC_MODIF { get; init; }
        public int? UNIDADES_MINIMAS { get; init; }
        public decimal? PRECIO_UNITARIO { get; init; }
        public decimal? PRECIO_DOCENA { get; init; }
        public decimal? PRECIO_MAYORISTA { get; init; }
        public decimal? DESC1 { get; init; }
        public decimal? DESC2 { get; init; }
        public decimal? DESC3 { get; init; }
        public decimal? DESC4 { get; init; }
        public string? OBSERVACION { get; init; }
        public string? USUARIO { get; init; }
    }
}
