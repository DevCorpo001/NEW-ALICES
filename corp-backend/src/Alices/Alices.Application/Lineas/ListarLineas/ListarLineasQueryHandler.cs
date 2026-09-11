using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Lineas.ListarLineas;

internal sealed class ListarLineasQueryHandler
    : IQueryHandler<ListarLineasQuery, IReadOnlyList<LineaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarLineasQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<LineaResponse>>> Handle(
        ListarLineasQuery request,
        CancellationToken cancellationToken)
    {
        var lineas = await LineaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarLinea",
            request.Codigo,
            request.Nombre);

        return Result.Success(lineas);
    }
}
