using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Marcas.ListarMarcaAuto;

internal sealed class ListarMarcaAutoQueryHandler
    : IQueryHandler<ListarMarcaAutoQuery, IReadOnlyList<MarcaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarMarcaAutoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<MarcaResponse>>> Handle(
        ListarMarcaAutoQuery request,
        CancellationToken cancellationToken)
    {
        var marcas = await MarcaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarMarca_Auto",
            request.Codigo,
            request.Nombre);

        return Result.Success(marcas);
    }
}
