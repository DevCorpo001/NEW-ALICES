using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Proveedores.ListarProveedores;

internal sealed class ListarProveedoresQueryHandler
    : IQueryHandler<ListarProveedoresQuery, IReadOnlyList<ProveedorResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarProveedoresQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<ProveedorResponse>>> Handle(
        ListarProveedoresQuery request,
        CancellationToken cancellationToken)
    {
        var proveedores = await ProveedorConsultas.BuscarAsync(
            _sqlConnectionFactory,
            request.Ruc,
            request.RazonSocial,
            request.Criterio,
            limite: 200);

        return Result.Success(proveedores);
    }
}
