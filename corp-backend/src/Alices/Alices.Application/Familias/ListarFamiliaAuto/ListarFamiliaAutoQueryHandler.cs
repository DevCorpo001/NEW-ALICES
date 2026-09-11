using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Familias.ListarFamiliaAuto;

internal sealed class ListarFamiliaAutoQueryHandler
    : IQueryHandler<ListarFamiliaAutoQuery, IReadOnlyList<FamiliaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarFamiliaAutoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<FamiliaResponse>>> Handle(
        ListarFamiliaAutoQuery request,
        CancellationToken cancellationToken)
    {
        var familias = await FamiliaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarFamilia_Auto",
            request.Codigo,
            request.Nombre);

        return Result.Success(familias);
    }
}
