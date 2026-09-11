using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;
using Alices.Domain.Familias;
using Dapper;
using System.Data;

namespace Alices.Application.Familias.AgregarFamilia;

/// <remarks>
/// Escritura con Dapper y stored procedure, no con EF + UnitOfWork como
/// describe ARCHITECTURE.md: las tablas de catálogos son legacy y su lógica
/// vive en los SP.
/// </remarks>
internal sealed class AgregarFamiliaCommandHandler : ICommandHandler<AgregarFamiliaCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public AgregarFamiliaCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(AgregarFamiliaCommand request, CancellationToken cancellationToken)
    {
        var codigo = request.Codigo.Trim();

        var existentes = await FamiliaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarFamilia",
            codigo,
            null);

        // Coincidencia exacta: el SP puede filtrar por LIKE y `Count > 0`
        // bloquearía códigos que solo comparten prefijo.
        if (existentes.Any(f => string.Equals(f.Codigo, codigo, StringComparison.OrdinalIgnoreCase)))
        {
            return Result.Failure(FamiliaErrors.YaExiste);
        }

        var parameters = new DynamicParameters();
        parameters.Add("@codFamilia", codigo, DbType.AnsiString);
        parameters.Add("@nombreFamilia", request.Nombre.Trim(), DbType.AnsiString);
        parameters.Add("@abreviadoFamilia", CatalogoSql.Normalizar(request.Abreviado), DbType.AnsiString);
        parameters.Add("@codLinea", CatalogoSql.Normalizar(request.CodigoLinea), DbType.AnsiString);

        await CatalogoSql.EjecutarAsync(_sqlConnectionFactory, "dbo.sp_AgregarFamilia", parameters);

        return Result.Success();
    }
}
