using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;

namespace Alices.Application.Clases.ObtenerSiguienteCodigoClase;

internal sealed class ObtenerSiguienteCodigoClaseQueryHandler
    : IQueryHandler<ObtenerSiguienteCodigoClaseQuery, SiguienteCodigoClaseResponse>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ObtenerSiguienteCodigoClaseQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<SiguienteCodigoClaseResponse>> Handle(
        ObtenerSiguienteCodigoClaseQuery request,
        CancellationToken cancellationToken)
    {
        var clases = await ClaseConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarClase",
            null,
            null);

        return Result.Success(new SiguienteCodigoClaseResponse
        {
            Codigo = SiguienteCodigo.Calcular(clases.Select(clase => clase.Codigo))
        });
    }
}
