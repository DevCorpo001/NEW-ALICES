using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Marcas.ListarMarcas;

internal sealed class ListarMarcasQueryHandler
    : IQueryHandler<ListarMarcasQuery, IReadOnlyList<MarcaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarMarcasQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<MarcaResponse>>> Handle(
        ListarMarcasQuery request,
        CancellationToken cancellationToken)
    {
        var marcas = await MarcaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarMarca",
            request.Codigo,
            request.Nombre);

        return Result.Success(marcas);
    }
}
