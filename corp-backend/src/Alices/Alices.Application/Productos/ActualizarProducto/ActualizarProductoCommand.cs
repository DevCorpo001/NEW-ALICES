using Alices.Application.Abstractions.Messaging;
using Alices.Application.Productos.EncontrarProducto;

namespace Alices.Application.Productos.ActualizarProducto;

/// <summary>
/// Actualización de producto (`sp_ActualizarProducto`).
///
/// A diferencia del alta, el SP no recibe el código de barra: los códigos se
/// administran por su propio mantenimiento.
///
/// Devuelve la ficha releída de la base: es la forma de confirmar que la
/// actualización quedó guardada de verdad, ya que el SP no informa de ello.
/// </summary>
public sealed record ActualizarProductoCommand(
    int IdProducto,
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
    string? Unidad) : ICommand<ProductoDetalleResponse>;
