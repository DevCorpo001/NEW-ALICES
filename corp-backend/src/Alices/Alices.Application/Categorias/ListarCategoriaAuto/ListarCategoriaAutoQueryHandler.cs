using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Categorias.ListarCategoriaAuto;

internal sealed class ListarCategoriaAutoQueryHandler
    : IQueryHandler<ListarCategoriaAutoQuery, IReadOnlyList<CategoriaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarCategoriaAutoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<CategoriaResponse>>> Handle(
        ListarCategoriaAutoQuery request,
        CancellationToken cancellationToken)
    {
        var categorias = await CategoriaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarCategoria_Auto",
            request.Codigo,
            request.Nombre);

        return Result.Success(categorias);
    }
}
