using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.AgregarProducto;

/// <summary>
/// Alta de producto (`sp_AgregarProducto`).
///
/// Los catálogos se envían por id, que es lo que espera el SP; el frontend los
/// conserva al elegir en cada modal.
/// </summary>
public sealed record AgregarProductoCommand(
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
    string? CodigoBarra) : ICommand;
