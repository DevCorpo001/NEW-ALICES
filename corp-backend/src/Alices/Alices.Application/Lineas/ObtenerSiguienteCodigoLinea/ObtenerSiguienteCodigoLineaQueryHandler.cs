using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;

namespace Alices.Application.Lineas.ObtenerSiguienteCodigoLinea;

internal sealed class ObtenerSiguienteCodigoLineaQueryHandler
    : IQueryHandler<ObtenerSiguienteCodigoLineaQuery, SiguienteCodigoLineaResponse>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ObtenerSiguienteCodigoLineaQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<SiguienteCodigoLineaResponse>> Handle(
        ObtenerSiguienteCodigoLineaQuery request,
        CancellationToken cancellationToken)
    {
        var lineas = await LineaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarLinea",
            null,
            null);

        return Result.Success(new SiguienteCodigoLineaResponse
        {
            Codigo = SiguienteCodigo.Calcular(lineas.Select(linea => linea.Codigo))
        });
    }
}
