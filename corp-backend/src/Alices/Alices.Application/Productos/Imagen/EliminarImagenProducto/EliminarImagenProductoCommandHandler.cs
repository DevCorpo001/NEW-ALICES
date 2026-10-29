using System.Data;
using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;

namespace Alices.Application.Productos.Imagen.EliminarImagenProducto;

internal sealed class EliminarImagenProductoCommandHandler
    : ICommandHandler<EliminarImagenProductoCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public EliminarImagenProductoCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(
        EliminarImagenProductoCommand request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@idProducto", request.IdProducto, DbType.Int32);

        var rutaActual = await connection.QueryFirstOrDefaultAsync<string>(
            "SELECT IMAGEN FROM PRODUCTO WHERE ID_PRODUCTO = @idProducto",
            parameters);

        if (!string.IsNullOrWhiteSpace(rutaActual))
        {
            var rutaFisica = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                rutaActual.TrimStart('/', '\\'));

            if (File.Exists(rutaFisica))
            {
                try
                {
                    File.Delete(rutaFisica);
                }
                catch
                {
                    // Se continúa para asegurar que se limpie la referencia en base de datos
                }
            }
        }

        await connection.ExecuteAsync(
            "UPDATE PRODUCTO SET IMAGEN = NULL WHERE ID_PRODUCTO = @idProducto",
            parameters);

        return Result.Success();
    }
}
