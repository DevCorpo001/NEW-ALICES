using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Clases.ListarClaseAuto;

internal sealed class ListarClaseAutoQueryHandler
    : IQueryHandler<ListarClaseAutoQuery, IReadOnlyList<ClaseResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarClaseAutoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<ClaseResponse>>> Handle(
        ListarClaseAutoQuery request,
        CancellationToken cancellationToken)
    {
        var clases = await ClaseConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarClase_Auto",
            request.Codigo,
            request.Nombre);

        return Result.Success(clases);
    }
}
