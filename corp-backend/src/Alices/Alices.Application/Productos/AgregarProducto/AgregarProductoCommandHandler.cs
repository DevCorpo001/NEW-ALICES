using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Alices.Domain.Productos;
using Dapper;
using System.Data;

namespace Alices.Application.Productos.AgregarProducto;

/// <remarks>
/// Escritura con Dapper y stored procedure, no con EF + UnitOfWork como
/// describe ARCHITECTURE.md: la tabla de productos es legacy y su lógica de
/// inserción vive en el SP.
/// </remarks>
internal sealed class AgregarProductoCommandHandler : ICommandHandler<AgregarProductoCommand>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public AgregarProductoCommandHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result> Handle(AgregarProductoCommand request, CancellationToken cancellationToken)
    {
        var codigo = request.Codigo.Trim();
        var barra = ProductoValidacion.Normalizar(request.CodigoBarra);

        var (existeCodigo, existeBarra) = await ProductoValidacion.ComprobarAsync(
            _sqlConnectionFactory,
            codigo,
            null,
            barra);

        if (existeCodigo)
        {
            return Result.Failure(ProductoErrors.CodigoYaExiste);
        }

        if (existeBarra)
        {
            return Result.Failure(ProductoErrors.BarraYaExiste);
        }

        var parameters = new DynamicParameters();
        parameters.Add("@COD_PRODUCTO", codigo, DbType.AnsiString);
        parameters.Add("@DESC_PRODUCTO", request.Descripcion.Trim(), DbType.AnsiString);
        parameters.Add("@NOMB_CORTO", ProductoValidacion.Normalizar(request.NombreCorto), DbType.AnsiString);
        parameters.Add("@IDFAMILIA", request.IdFamilia, DbType.Int32);
        parameters.Add("@ID_CLASE", request.IdClase, DbType.Int32);
        parameters.Add("@ID_LINEA", request.IdLinea, DbType.Int32);
        parameters.Add("@IDPROVEEDOR", request.IdProveedor, DbType.Int32);
        parameters.Add("@IDMARCA", request.IdMarca, DbType.Int32);
        parameters.Add("@IDCATEGORIA", request.IdCategoria, DbType.Int32);
        parameters.Add("@PERCEPCION", ProductoValidacion.Normalizar(request.Percepcion), DbType.AnsiString);
        parameters.Add("@ESTADO", ProductoValidacion.Normalizar(request.Estado), DbType.AnsiString);
        parameters.Add("@ORIGEN", ProductoValidacion.Normalizar(request.Origen), DbType.AnsiString);
        parameters.Add("@FECHAREG", request.FechaRegistro, DbType.DateTime);
        parameters.Add("@UNIDAD", ProductoValidacion.Normalizar(request.Unidad), DbType.AnsiString);
        parameters.Add("@BARRA", barra, DbType.AnsiString);
        parameters.Add("@IDGRUPO", request.IdGrupo, DbType.Int32);

        using var connection = _sqlConnectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            "dbo.sp_AgregarProducto",
            parameters,
            commandType: CommandType.StoredProcedure);

        return Result.Success();
    }
}
