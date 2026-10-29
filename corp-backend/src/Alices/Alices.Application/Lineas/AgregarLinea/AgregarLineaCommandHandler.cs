using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;
using Alices.Domain.Lineas;
using Dapper;
using System.Data;

namespace Alices.Application.Lineas.AgregarLinea;

/// <summary>
/// Alta de línea sobre la base legacy.
/// </summary>
/// <remarks>
/// Escritura con Dapper y stored procedure, no con EF + UnitOfWork como
/// describe ARCHITECTURE.md: las tablas de catálogos son legacy, no tienen
/// agregado ni mapeo EF, y toda su lógica vive en los SP.
/// </remarks>
internal sealed class AgregarLineaCommandHandler : ICommandHandler<AgregarLineaCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public AgregarLineaCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(AgregarLineaCommand request, CancellationToken cancellationToken)
    {
        var codigo = request.Codigo.Trim();

        var existentes = await LineaConsultas.ListarAsync(
            _sqlConnectionFactory,
            "dbo.sp_ListarLinea",
            codigo,
            null);

        // El sistema anterior daba por duplicado cualquier resultado del SP.
        // Como el filtro puede ser parcial, aquí se exige coincidencia exacta
        // para no bloquear códigos que solo comparten prefijo.
        var duplicado = existentes.Any(linea =>
            string.Equals(linea.Codigo, codigo, StringComparison.OrdinalIgnoreCase));

        if (duplicado)
        {
            return Result.Failure(LineaErrors.YaExiste);
        }

        var parameters = new DynamicParameters();
        parameters.Add("@codLinea", codigo, DbType.AnsiString);
        parameters.Add("@nombreLinea", request.Nombre.Trim(), DbType.AnsiString);
        parameters.Add("@abreviadoLinea", CatalogoSql.Normalizar(request.Abreviado), DbType.AnsiString);

        await CatalogoSql.EjecutarAsync(_sqlConnectionFactory, "dbo.sp_AgregarLinea", parameters);

        return Result.Success();
    }
}
