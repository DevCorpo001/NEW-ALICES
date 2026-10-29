using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Lineas.ListarLineaAuto;

internal sealed class ListarLineaAutoQueryHandler
    : IQueryHandler<ListarLineaAutoQuery, IReadOnlyList<LineaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarLineaAutoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<LineaResponse>>> Handle(
        ListarLineaAutoQuery request,
        CancellationToken cancellationToken)
    {
        var lineas = await LineaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarLinea_Auto",
            request.Codigo,
            request.Nombre);

        return Result.Success(lineas);
    }
}
