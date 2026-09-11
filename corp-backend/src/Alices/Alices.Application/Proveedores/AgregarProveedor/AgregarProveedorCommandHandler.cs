using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;
using Alices.Domain.Proveedores;
using Dapper;
using System.Data;

namespace Alices.Application.Proveedores.AgregarProveedor;

/// <remarks>
/// Escritura con Dapper y stored procedure; ver nota en ARCHITECTURE.md sobre
/// los catálogos legacy.
/// </remarks>
internal sealed class AgregarProveedorCommandHandler : ICommandHandler<AgregarProveedorCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public AgregarProveedorCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(AgregarProveedorCommand request, CancellationToken cancellationToken)
    {
        var ruc = request.Ruc.Trim();

        var existentes = await ProveedorConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarProveedor",
            ruc,
            null);

        if (existentes.Any(p => string.Equals(p.Ruc, ruc, StringComparison.OrdinalIgnoreCase)))
        {
            return Result.Failure(ProveedorErrors.YaExiste);
        }

        var parameters = new DynamicParameters();
        parameters.Add("@ruc", ruc, DbType.AnsiString);
        parameters.Add("@razonSocial", request.RazonSocial.Trim(), DbType.AnsiString);
        parameters.Add("@nombreComercial", CatalogoSql.Normalizar(request.NombreComercial), DbType.AnsiString);
        parameters.Add("@direccion", CatalogoSql.Normalizar(request.Direccion), DbType.AnsiString);
        parameters.Add("@nombreVendedor", CatalogoSql.Normalizar(request.NombreVendedor), DbType.AnsiString);

        await CatalogoSql.EjecutarAsync(_sqlConnectionFactory, "dbo.sp_AgregarProveedor", parameters);

        return Result.Success();
    }
}
