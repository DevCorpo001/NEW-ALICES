using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Productos.ValidarCreacionProducto;

internal sealed class ValidarCreacionProductoQueryHandler
    : IQueryHandler<ValidarCreacionProductoQuery, ValidarCreacionProductoResponse>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ValidarCreacionProductoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<ValidarCreacionProductoResponse>> Handle(
        ValidarCreacionProductoQuery request,
        CancellationToken cancellationToken)
    {
        var (existeCodigo, existeBarra) = await ProductoValidacion.ComprobarAsync(
            _sqlConnectionFactory,
            request.Codigo,
            request.IdProducto,
            request.CodigoBarra);

        return Result.Success(new ValidarCreacionProductoResponse
        {
            ExisteCodigo = existeCodigo,
            ExisteBarra = existeBarra
        });
    }
}
