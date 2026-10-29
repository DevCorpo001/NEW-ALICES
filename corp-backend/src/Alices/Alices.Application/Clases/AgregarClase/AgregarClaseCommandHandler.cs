using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;
using Alices.Domain.Clases;
using Dapper;
using System.Data;

namespace Alices.Application.Clases.AgregarClase;

/// <remarks>
/// Escritura con Dapper y stored procedure; ver nota en ARCHITECTURE.md sobre
/// los catálogos legacy.
/// </remarks>
internal sealed class AgregarClaseCommandHandler : ICommandHandler<AgregarClaseCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public AgregarClaseCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(AgregarClaseCommand request, CancellationToken cancellationToken)
    {
        var codigo = request.Codigo.Trim();

        var existentes = await ClaseConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarClase",
            codigo,
            null);

        if (existentes.Any(c => string.Equals(c.Codigo, codigo, StringComparison.OrdinalIgnoreCase)))
        {
            return Result.Failure(ClaseErrors.YaExiste);
        }

        var parameters = new DynamicParameters();
        parameters.Add("@codClase", codigo, DbType.AnsiString);
        parameters.Add("@nombreClase", request.Nombre.Trim(), DbType.AnsiString);
        parameters.Add("@nombreCorto", CatalogoSql.Normalizar(request.NombreCorto), DbType.AnsiString);
        parameters.Add("@codLinea", CatalogoSql.Normalizar(request.CodigoLinea), DbType.AnsiString);
        parameters.Add("@codFamilia", CatalogoSql.Normalizar(request.CodigoFamilia), DbType.AnsiString);

        await CatalogoSql.EjecutarAsync(_sqlConnectionFactory, "dbo.sp_AgregarClase", parameters);

        return Result.Success();
    }
}
