using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;
using Alices.Domain.Marcas;
using Dapper;
using System.Data;

namespace Alices.Application.Marcas.AgregarMarca;

/// <remarks>
/// A diferencia de línea, familia o clase, `sp_AgregarMarca` valida por su
/// cuenta y devuelve `RESULTADO` / `MENSAJE`. No se hace comprobación previa de
/// duplicado: la decisión es de la base y así no hay dos reglas que puedan
/// discrepar.
/// </remarks>
internal sealed class AgregarMarcaCommandHandler : ICommandHandler<AgregarMarcaCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public AgregarMarcaCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(AgregarMarcaCommand request, CancellationToken cancellationToken)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@CodMarca", request.Codigo.Trim(), DbType.AnsiString);
        parameters.Add("@NombreMarca", request.Nombre.Trim(), DbType.AnsiString);

        var (resultado, mensaje) = await CatalogoSql.EjecutarConResultadoAsync(
            _sqlConnectionFactory,
            "dbo.sp_AgregarMarca",
            parameters);

        return resultado ? Result.Success() : Result.Failure(MarcaErrors.NoRegistrada(mensaje));
    }
}
