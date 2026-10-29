using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Clases.ListarClases;

internal sealed class ListarClasesQueryHandler
    : IQueryHandler<ListarClasesQuery, IReadOnlyList<ClaseResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarClasesQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<ClaseResponse>>> Handle(
        ListarClasesQuery request,
        CancellationToken cancellationToken)
    {
        var clases = await ClaseConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarClase",
            request.Codigo,
            request.Nombre);

        return Result.Success(clases);
    }
}
