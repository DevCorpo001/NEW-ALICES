using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.Imagen.EliminarImagenProducto;

public sealed record EliminarImagenProductoCommand(int IdProducto) : ICommand;
