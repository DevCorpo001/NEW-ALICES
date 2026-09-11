using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Application.Productos.EncontrarProducto;
using Alices.Domain.Abstractions;
using Alices.Domain.Productos;
using Dapper;
using System.Data;

namespace Alices.Application.Productos.ActualizarProducto;

/// <remarks>
/// El sistema anterior atrapaba cualquier excepción de este SP, la escribía en
/// consola y aun así respondía `success = true`: una actualización fallida se
/// reportaba como correcta. Aquí la excepción sube al middleware y el cliente
/// recibe un 500.
/// </remarks>
internal sealed class ActualizarProductoCommandHandler
    : ICommandHandler<ActualizarProductoCommand, ProductoDetalleResponse>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ActualizarProductoCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<ProductoDetalleResponse>> Handle(
        ActualizarProductoCommand request,
        CancellationToken cancellationToken)
    {
        var codigo = request.Codigo.Trim();

        // Se pasa el id para que el SP excluya al propio producto de la
        // comprobación; si no, renombrar sin cambiar el código chocaría consigo.
        var (existeCodigo, _) = await ProductoValidacion.ComprobarAsync(
            _sqlConnectionFactory,
            codigo,
            request.IdProducto,
            null);

        if (existeCodigo)
        {
            return Result.Failure<ProductoDetalleResponse>(ProductoErrors.CodigoYaExiste);
        }

        var parameters = new DynamicParameters();
        parameters.Add("@IdProd", request.IdProducto, DbType.Int32);
        parameters.Add("@COD_PRODUCTO", codigo, DbType.AnsiString);
        parameters.Add("@DESC_PRODUCTO", request.Descripcion.Trim(), DbType.AnsiString);
        parameters.Add("@NOMB_CORTO", ProductoValidacion.Normalizar(request.NombreCorto), DbType.AnsiString);
        parameters.Add("@IDFAMILIA", request.IdFamilia, DbType.Int32);
        parameters.Add("@ID_LINEA", request.IdLinea, DbType.Int32);
        parameters.Add("@ID_CLASE", request.IdClase, DbType.Int32);
        parameters.Add("@IDPROVEEDOR", request.IdProveedor, DbType.Int32);
        parameters.Add("@PERCEPCION", ProductoValidacion.Normalizar(request.Percepcion), DbType.AnsiString);
        parameters.Add("@ESTADO", ProductoValidacion.Normalizar(request.Estado), DbType.AnsiString);
        parameters.Add("@ORIGEN", ProductoValidacion.Normalizar(request.Origen), DbType.AnsiString);
        parameters.Add("@FECHAREG", request.FechaRegistro, DbType.DateTime);
        parameters.Add("@UNIDAD", ProductoValidacion.Normalizar(request.Unidad), DbType.AnsiString);
        parameters.Add("@IDGRUPO", request.IdGrupo, DbType.Int32);
        parameters.Add("@IDMARCA", request.IdMarca, DbType.Int32);
        parameters.Add("@IDCATEGORIA", request.IdCategoria, DbType.Int32);

        using (var connection = _sqlConnectionFactory.CreateConnection())
        {
            await connection.ExecuteAsync(
                "dbo.sp_ActualizarProducto",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        // Se relee para devolver lo que realmente quedó en la base. El SP no
        // informa de si modificó algo, y su contador de filas no es fiable si
        // usa SET NOCOUNT ON; releer es la comprobación que sí vale.
        var actualizado = (await ProductoConsultas.BuscarPorCodigoAsync(_sqlConnectionFactory, codigo))
            .FirstOrDefault();

        return actualizado is null
            ? Result.Failure<ProductoDetalleResponse>(ProductoErrors.NoEncontrado)
            : Result.Success(actualizado);
    }
}
