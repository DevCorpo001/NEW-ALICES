using Alices.Application.Productos.ActualizarProducto;
using Alices.Application.Productos.AgregarProducto;
using Alices.Application.Productos.Almacenes.ActualizarStockAlmacen;
using Alices.Application.Productos.Almacenes.ListarStockAlmacenPorPrecio;
using Alices.Application.Productos.EliminarPreciosDeCanal;
using Alices.Application.Productos.EncontrarProducto;
using Alices.Application.Productos.Imagen.EliminarImagenProducto;
using Alices.Application.Productos.Imagen.SubirImagenProducto;
using Alices.Application.Productos.ListarCodigosBarra;
using Alices.Application.Productos.ListarHistorialPrecio;
using Alices.Application.Productos.ListarPreciosProducto;
using Alices.Application.Productos.ListarProductoAuto;
using Alices.Application.Productos.Proveedores.AsociarProveedorProducto;
using Alices.Application.Productos.Proveedores.EliminarProveedorProducto;
using Alices.Application.Productos.Proveedores.ListarProveedoresProducto;
using Alices.Application.Productos.ValidarCreacionProducto;
using Alices.Domain.Productos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Controllers.Productos;

[ApiController]
[Route("api/productos")]
public sealed class ProductosController : ControllerBase
{
    private readonly ISender _sender;

    public ProductosController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("autocomplete")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarAuto(
        [FromQuery] string? busqueda,
        [FromQuery] string? estado,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarProductoAutoQuery(busqueda, estado), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>
    /// Valida contra la base si un código de producto o un código de barra ya
    /// están registrados. Se envía únicamente el parámetro a comprobar.
    /// </summary>
    [HttpGet("validar")]
    [AllowAnonymous]
    public async Task<IActionResult> Validar(
        [FromQuery] string? codigo,
        [FromQuery] int? idProducto,
        [FromQuery] string? codigoBarra,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new ValidarCreacionProductoQuery(codigo, idProducto, codigoBarra),
            cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>
    /// Ficha completa del producto por su código, con sus catálogos
    /// relacionados. Devuelve 404 si no existe.
    /// </summary>
    [HttpGet("buscar")]
    [AllowAnonymous]
    public async Task<IActionResult> Encontrar(
        [FromQuery] string codigoProducto,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new EncontrarProductoQuery(codigoProducto), cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(result.Error);
        }

        var producto = result.Value.FirstOrDefault();
        return producto is null ? NotFound() : Ok(producto);
    }

    /// <summary>Lista de precios del producto, agrupada por canal.</summary>
    [HttpGet("{idProducto:int}/precios")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarPrecios(int idProducto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarPreciosProductoQuery(idProducto), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Elimina el precio del canal: la fila base y todos sus rangos por cantidad.</summary>
    [HttpDelete("{idProducto:int}/precios/canal/{idCanal:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> EliminarPreciosDeCanal(
        int idProducto,
        int idCanal,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new EliminarPreciosDeCanalCommand(idProducto, idCanal),
            cancellationToken);

        if (result.IsFailure)
        {
            var cuerpo = new { error = result.Error.Code, message = result.Error.Name };
            return result.Error == ProductoErrors.PrecioNoExiste ? NotFound(cuerpo) : BadRequest(cuerpo);
        }

        return NoContent();
    }

    /// <summary>Historial de cambios de un precio, del más reciente al más antiguo.</summary>
    [HttpGet("precios/{idPrecio:int}/historial")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarHistorialPrecio(int idPrecio, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarHistorialPrecioQuery(idPrecio), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Códigos de barra registrados del producto.</summary>
    [HttpGet("{idProducto:int}/codigos-barra")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarCodigosBarra(int idProducto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarCodigosBarraQuery(idProducto), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Proveedores asociados al producto.</summary>
    [HttpGet("{idProducto:int}/proveedores")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarProveedores(int idProducto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarProveedoresProductoQuery(idProducto), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Asocia un proveedor al producto.</summary>
    [HttpPost("{idProducto:int}/proveedores")]
    [AllowAnonymous]
    public async Task<IActionResult> AsociarProveedor(
        int idProducto,
        [FromBody] AsociarProveedorProductoRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new AsociarProveedorProductoCommand(idProducto, request.IdProveedor),
            cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error.Code, message = result.Error.Name });
        }

        return Ok(new { mensaje = "Proveedor asociado correctamente" });
    }

    /// <summary>Elimina la asociación de un proveedor con el producto.</summary>
    [HttpDelete("{idProducto:int}/proveedores/{idProductoProveedor:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> EliminarProveedor(
        int idProducto,
        int idProductoProveedor,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new EliminarProveedorProductoCommand(idProductoProveedor),
            cancellationToken);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error.Code, message = result.Error.Name });
        }

        return NoContent();
    }

    /// <summary>Alta de producto. Rechaza código o código de barra repetidos.</summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Agregar(
        [FromBody] GuardarProductoRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new AgregarProductoCommand(
                request.Codigo,
                request.Descripcion,
                request.NombreCorto,
                request.IdLinea,
                request.IdFamilia,
                request.IdClase,
                request.IdMarca,
                request.IdCategoria,
                request.IdProveedor,
                request.IdGrupo,
                request.Percepcion,
                request.Estado,
                request.Origen,
                request.FechaRegistro,
                request.Unidad,
                request.CodigoBarra),
            cancellationToken);

        if (result.IsFailure)
        {
            return Conflict(new { error = result.Error.Code, message = result.Error.Name });
        }

        return NoContent();
    }

    /// <summary>Actualización de producto. El código de barra no se toca aquí.</summary>
    [HttpPut("{idProducto:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> Actualizar(
        int idProducto,
        [FromBody] GuardarProductoRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new ActualizarProductoCommand(
                idProducto,
                request.Codigo,
                request.Descripcion,
                request.NombreCorto,
                request.IdLinea,
                request.IdFamilia,
                request.IdClase,
                request.IdMarca,
                request.IdCategoria,
                request.IdProveedor,
                request.IdGrupo,
                request.Percepcion,
                request.Estado,
                request.Origen,
                request.FechaRegistro,
                request.Unidad),
            cancellationToken);

        if (result.IsFailure)
        {
            var cuerpo = new { error = result.Error.Code, message = result.Error.Name };
            // Releer y no encontrar el producto significa que el SP no guardó
            // nada; eso es un 404, no un conflicto de códigos.
            return result.Error == ProductoErrors.NoEncontrado
                ? NotFound(cuerpo)
                : Conflict(cuerpo);
        }

        // Se devuelve la ficha releída: confirma que la actualización quedó.
        return Ok(result.Value);
    }

    /// <summary>Lista de existencias por almacén asociadas al precio del canal.</summary>
    [HttpGet("precios/{idPrecio:int}/almacenes")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarStockAlmacen(int idPrecio, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListarStockAlmacenPorPrecioQuery(idPrecio), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Ajusta el stock por almacén (sumar o actualizar existencias).</summary>
    [HttpPut("precios/{idPrecio:int}/almacenes")]
    [AllowAnonymous]
    public async Task<IActionResult> ActualizarStockAlmacen(
        int idPrecio,
        [FromBody] ActualizarStockAlmacenRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new ActualizarStockAlmacenCommand(idPrecio, request.Ajustes),
            cancellationToken);

        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    /// <summary>Sube o actualiza la imagen de un producto.</summary>
    [HttpPost("{idProducto:int}/imagen")]
    [AllowAnonymous]
    public async Task<IActionResult> SubirImagen(
        int idProducto,
        IFormFile? archivo,
        CancellationToken cancellationToken)
    {
        if (archivo is null || archivo.Length == 0)
        {
            return BadRequest(new { error = "Producto.ArchivoVacio", message = "No se envió ningún archivo de imagen válido." });
        }

        await using var stream = archivo.OpenReadStream();
        var result = await _sender.Send(
            new SubirImagenProductoCommand(idProducto, stream, archivo.FileName, archivo.ContentType),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new { url = result.Value })
            : BadRequest(new { error = result.Error.Code, message = result.Error.Name });
    }

    /// <summary>Elimina la imagen de un producto.</summary>
    [HttpDelete("{idProducto:int}/imagen")]
    [AllowAnonymous]
    public async Task<IActionResult> EliminarImagen(int idProducto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new EliminarImagenProductoCommand(idProducto), cancellationToken);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}

public sealed record ActualizarStockAlmacenRequest(IReadOnlyList<AjusteStockItem> Ajustes);

/// <summary>
/// Cuerpo compartido por el alta y la actualización. `CodigoBarra` solo se
/// usa en el alta: al actualizar, los códigos van por su propio mantenimiento.
/// </summary>
public sealed record GuardarProductoRequest(
    string Codigo,
    string Descripcion,
    string? NombreCorto,
    int? IdLinea,
    int? IdFamilia,
    int? IdClase,
    int? IdMarca,
    int? IdCategoria,
    int? IdProveedor,
    int? IdGrupo,
    string? Percepcion,
    string? Estado,
    string? Origen,
    DateTime? FechaRegistro,
    string? Unidad,
    string? CodigoBarra);
