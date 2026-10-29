using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Familias.ListarFamilias;

internal sealed class ListarFamiliasQueryHandler
    : IQueryHandler<ListarFamiliasQuery, IReadOnlyList<FamiliaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarFamiliasQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<FamiliaResponse>>> Handle(
        ListarFamiliasQuery request,
        CancellationToken cancellationToken)
    {
        var familias = await FamiliaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarFamilia",
            request.Codigo,
            request.Nombre);

        return Result.Success(familias);
    }
}
