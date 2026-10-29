using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;

namespace Alices.Application.Proveedores.ListarProveedorAuto;

internal sealed class ListarProveedorAutoQueryHandler
    : IQueryHandler<ListarProveedorAutoQuery, IReadOnlyList<ProveedorResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ListarProveedorAutoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<ProveedorResponse>>> Handle(
        ListarProveedorAutoQuery request,
        CancellationToken cancellationToken)
    {
        var proveedores = await ProveedorConsultas.BuscarAsync(
            _sqlConnectionFactory,
            request.Ruc,
            request.RazonSocial,
            request.Criterio,
            limite: 15);

        return Result.Success(proveedores);
    }
}
