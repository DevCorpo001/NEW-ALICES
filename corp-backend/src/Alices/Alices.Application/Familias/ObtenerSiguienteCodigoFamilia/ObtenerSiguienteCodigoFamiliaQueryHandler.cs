using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;

namespace Alices.Application.Familias.ObtenerSiguienteCodigoFamilia;

internal sealed class ObtenerSiguienteCodigoFamiliaQueryHandler
    : IQueryHandler<ObtenerSiguienteCodigoFamiliaQuery, SiguienteCodigoFamiliaResponse>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ObtenerSiguienteCodigoFamiliaQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<SiguienteCodigoFamiliaResponse>> Handle(
        ObtenerSiguienteCodigoFamiliaQuery request,
        CancellationToken cancellationToken)
    {
        var familias = await FamiliaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarFamilia",
            null,
            null);

        return Result.Success(new SiguienteCodigoFamiliaResponse
        {
            Codigo = SiguienteCodigo.Calcular(familias.Select(familia => familia.Codigo))
        });
    }
}
