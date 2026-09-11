using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Catalogos;
using Alices.Domain.Abstractions;
using Alices.Domain.Categorias;
using Dapper;
using System.Data;

namespace Alices.Application.Categorias.AgregarCategoria;

/// <remarks>
/// `sp_AgregarCategoria` valida por su cuenta y devuelve `RESULTADO` /
/// `MENSAJE`; no se duplica aquí la comprobación de existencia.
/// </remarks>
internal sealed class AgregarCategoriaCommandHandler : ICommandHandler<AgregarCategoriaCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public AgregarCategoriaCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(AgregarCategoriaCommand request, CancellationToken cancellationToken)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@CodCategoria", request.Codigo.Trim(), DbType.AnsiString);
        parameters.Add("@NombreCategoria", request.Nombre.Trim(), DbType.AnsiString);

        var (resultado, mensaje) = await CatalogoSql.EjecutarConResultadoAsync(
            _sqlConnectionFactory,
            "dbo.sp_AgregarCategoria",
            parameters);

        return resultado ? Result.Success() : Result.Failure(CategoriaErrors.NoRegistrada(mensaje));
    }
}
