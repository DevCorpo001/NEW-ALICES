using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Categorias.ListarCategorias;

internal sealed class ListarCategoriasQueryHandler
    : IQueryHandler<ListarCategoriasQuery, IReadOnlyList<CategoriaResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarCategoriasQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<CategoriaResponse>>> Handle(
        ListarCategoriasQuery request,
        CancellationToken cancellationToken)
    {
        var categorias = await CategoriaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarCategoria",
            request.Codigo,
            request.Nombre);

        return Result.Success(categorias);
    }
}
