using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Dapper;
using System.Data;

namespace Alices.Application.Productos.EncontrarProducto;

internal sealed class EncontrarProductoQueryHandler
    : IQueryHandler<EncontrarProductoQuery, IReadOnlyList<ProductoDetalleResponse>>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public EncontrarProductoQueryHandler(ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
    }

    public async Task<Result<IReadOnlyList<ProductoDetalleResponse>>> Handle(
        EncontrarProductoQuery request,
        CancellationToken cancellationToken)
    {
        var productos = await ProductoConsultas.BuscarPorCodigoAsync(
            _sqlConnectionFactory,
            request.CodigoProducto);

        return Result.Success(productos);
    }
}

/// <summary>
/// Proyección plana del SP. Todas las columnas son nullable a propósito: el
/// mapeo anterior usaba `GetInt16`/`GetDateTime` y reventaba en cuanto una
/// columna venía nula.
/// </summary>
internal sealed class ProductoDetalleRow
{
    public int? ID_PRODUCTO { get; init; }
    public string? COD_PRODUCTO { get; init; }
    public string? DESC_PRODUCTO { get; init; }
    public string? NOMB_CORTO { get; init; }
    public string? PERCEPCION { get; init; }
    public string? ESTADO { get; init; }
    public string? OBS_COSTEO { get; init; }
    public string? ORIGEN { get; init; }
    public string? UNIDAD { get; init; }
    public DateTime? FEC_REGProd { get; init; }

    public int? ID_LINEA { get; init; }
    public string? COD_LINEA { get; init; }
    public string? NOMBRE_LINEA { get; init; }
    public string? ABREVIADO_LINEA { get; init; }

    public int? ID_FAMILIA { get; init; }
    public string? COD_FAMILIA { get; init; }
    public string? NOMBRE_FAMILIA { get; init; }
    public string? ABREVIADO_FAMILIA { get; init; }

    public int? ID_CLASE { get; init; }
    public string? COD_CLASE { get; init; }
    public string? NOMBRE_CLASE { get; init; }

    public int? ID_MARCA { get; init; }
    public string? COD_MARCA { get; init; }
    public string? NOMBRE_MARCA { get; init; }

    public int? ID_CATEGORIA { get; init; }
    public string? COD_CATEGORIA { get; init; }
    public string? NOMBRE_CATEGORIA { get; init; }

    public int? ID_PROVEEDOR { get; init; }
    public string? RUC { get; init; }
    public string? RAZ_SOC { get; init; }
    public string? NCOMERCIAL { get; init; }
    public string? DIRECCION { get; init; }
    public DateTime? FEC_REG { get; init; }

    public int? ID_GRUPO { get; init; }
    public string? DESC_GRUPO { get; init; }

    public ProductoDetalleResponse AResponse(string? imagen = null) => new()
    {
        IdProducto = ID_PRODUCTO ?? 0,
        CodigoProducto = Limpiar(COD_PRODUCTO),
        Descripcion = Limpiar(DESC_PRODUCTO),
        NombreCorto = Limpiar(NOMB_CORTO),
        Percepcion = Limpiar(PERCEPCION),
        Estado = Limpiar(ESTADO),
        ObservacionCosteo = Limpiar(OBS_COSTEO),
        Origen = Limpiar(ORIGEN),
        Unidad = Limpiar(UNIDAD),
        FechaRegistro = FEC_REGProd,
        Imagen = Limpiar(imagen),
        Linea = new CatalogoRelacionadoResponse
        {
            Id = ID_LINEA,
            Codigo = Limpiar(COD_LINEA),
            Nombre = Limpiar(NOMBRE_LINEA),
            Abreviado = Limpiar(ABREVIADO_LINEA)
        },
        Familia = new CatalogoRelacionadoResponse
        {
            Id = ID_FAMILIA,
            Codigo = Limpiar(COD_FAMILIA),
            Nombre = Limpiar(NOMBRE_FAMILIA),
            Abreviado = Limpiar(ABREVIADO_FAMILIA)
        },
        Clase = new CatalogoRelacionadoResponse
        {
            Id = ID_CLASE,
            Codigo = Limpiar(COD_CLASE),
            Nombre = Limpiar(NOMBRE_CLASE),
            // El SP expone una única columna NOMB_CORTO, que el sistema anterior
            // usaba tanto para el producto como para el nombre corto de la clase.
            Abreviado = Limpiar(NOMB_CORTO)
        },
        Marca = new CatalogoRelacionadoResponse
        {
            Id = ID_MARCA,
            Codigo = Limpiar(COD_MARCA),
            Nombre = Limpiar(NOMBRE_MARCA)
        },
        Categoria = new CatalogoRelacionadoResponse
        {
            Id = ID_CATEGORIA,
            Codigo = Limpiar(COD_CATEGORIA),
            Nombre = Limpiar(NOMBRE_CATEGORIA)
        },
        Proveedor = new ProveedorRelacionadoResponse
        {
            IdProveedor = ID_PROVEEDOR,
            Ruc = Limpiar(RUC),
            RazonSocial = Limpiar(RAZ_SOC),
            NombreComercial = Limpiar(NCOMERCIAL),
            Direccion = Limpiar(DIRECCION),
            FechaRegistro = FEC_REG
        },
        Grupo = new GrupoRelacionadoResponse
        {
            IdGrupo = ID_GRUPO,
            Descripcion = Limpiar(DESC_GRUPO)
        }
    };

    /// <summary>
    /// Las columnas son CHAR de ancho fijo y llegan con relleno de espacios
    /// ("LIMAS DE U|AS                    "), que hay que recortar antes de
    /// mostrarlas.
    /// </summary>
    private static string? Limpiar(string? valor) => valor?.Trim();
}
