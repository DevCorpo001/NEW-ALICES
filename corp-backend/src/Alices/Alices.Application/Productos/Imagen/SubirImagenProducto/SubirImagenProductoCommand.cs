using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.Imagen.SubirImagenProducto;

public sealed record SubirImagenProductoCommand(
    int IdProducto,
    Stream ContenidoArchivo,
    string NombreOriginal,
    string ContentType) : ICommand<string>;
