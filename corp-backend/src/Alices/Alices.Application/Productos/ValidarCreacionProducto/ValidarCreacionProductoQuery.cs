using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.ValidarCreacionProducto;

/// <summary>
/// Comprueba contra la base si ya existe un producto con ese código o un
/// código de barra ya registrado. Los tres parámetros son opcionales: se envía
/// solo el que se quiere validar.
/// </summary>
public sealed record ValidarCreacionProductoQuery(
    string? Codigo,
    int? IdProducto,
    string? CodigoBarra) : IQuery<ValidarCreacionProductoResponse>;
