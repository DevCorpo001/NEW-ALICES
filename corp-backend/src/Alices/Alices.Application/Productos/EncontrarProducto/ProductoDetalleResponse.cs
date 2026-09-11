namespace Alices.Application.Productos.EncontrarProducto;

/// <summary>
/// Ficha completa de un producto (`sp_BuscarProducto`), con sus catálogos
/// relacionados anidados para que el formulario pueda rellenarse de una vez.
/// </summary>
public sealed class ProductoDetalleResponse
{
    public required int IdProducto { get; init; }
    public string? CodigoProducto { get; init; }
    public string? Descripcion { get; init; }
    public string? NombreCorto { get; init; }
    public string? Percepcion { get; init; }
    public string? Estado { get; init; }
    public string? ObservacionCosteo { get; init; }
    /// <summary>`L` local, `I` importado.</summary>
    public string? Origen { get; init; }
    public string? Unidad { get; init; }
    public DateTime? FechaRegistro { get; init; }
    public string? Imagen { get; init; }

    public required CatalogoRelacionadoResponse Linea { get; init; }
    public required CatalogoRelacionadoResponse Familia { get; init; }
    public required CatalogoRelacionadoResponse Clase { get; init; }
    public required CatalogoRelacionadoResponse Marca { get; init; }
    public required CatalogoRelacionadoResponse Categoria { get; init; }
    public required ProveedorRelacionadoResponse Proveedor { get; init; }
    public required GrupoRelacionadoResponse Grupo { get; init; }
}

/// <summary>
/// Forma común de línea, familia, clase, marca y categoría dentro de la ficha.
/// El `Id` es nulo cuando el producto no tiene ese catálogo asignado.
/// </summary>
public sealed class CatalogoRelacionadoResponse
{
    public int? Id { get; init; }
    public string? Codigo { get; init; }
    public string? Nombre { get; init; }
    /// <summary>Abreviado o nombre corto, según el catálogo.</summary>
    public string? Abreviado { get; init; }
}

public sealed class ProveedorRelacionadoResponse
{
    public int? IdProveedor { get; init; }
    public string? Ruc { get; init; }
    public string? RazonSocial { get; init; }
    public string? NombreComercial { get; init; }
    public string? Direccion { get; init; }
    public DateTime? FechaRegistro { get; init; }
}

public sealed class GrupoRelacionadoResponse
{
    public int? IdGrupo { get; init; }
    public string? Descripcion { get; init; }
}
