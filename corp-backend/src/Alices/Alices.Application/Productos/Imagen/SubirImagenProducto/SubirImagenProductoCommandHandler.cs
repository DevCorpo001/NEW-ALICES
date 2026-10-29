using System.Data;
using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;

namespace Alices.Application.Productos.Imagen.SubirImagenProducto;

internal sealed class SubirImagenProductoCommandHandler
    : ICommandHandler<SubirImagenProductoCommand, string>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public SubirImagenProductoCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<string>> Handle(
        SubirImagenProductoCommand request,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(request.NombreOriginal).ToLowerInvariant();
        var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };

        if (!extensionesPermitidas.Contains(extension))
        {
            return Result.Failure<string>(new Error(
                "Producto.ImagenInvalida",
                "Formato de imagen no permitido. Solo se aceptan .jpg, .jpeg, .png, .webp o .gif."));
        }

        var directorioDestino = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagenes", "productos");
        Directory.CreateDirectory(directorioDestino);

        var nombreArchivo = $"{request.IdProducto}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
        var rutaFisica = Path.Combine(directorioDestino, nombreArchivo);

        await using (var fileStream = new FileStream(rutaFisica, FileMode.Create, FileAccess.Write))
        {
            await request.ContenidoArchivo.CopyToAsync(fileStream, cancellationToken);
        }

        var rutaPublica = $"/imagenes/productos/{nombreArchivo}";

        using var connection = _sqlConnectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@imagen", rutaPublica, DbType.String);
        parameters.Add("@idProducto", request.IdProducto, DbType.Int32);

        await connection.ExecuteAsync(
            "UPDATE PRODUCTO SET IMAGEN = @imagen WHERE ID_PRODUCTO = @idProducto",
            parameters);

        return Result.Success(rutaPublica);
    }
}
