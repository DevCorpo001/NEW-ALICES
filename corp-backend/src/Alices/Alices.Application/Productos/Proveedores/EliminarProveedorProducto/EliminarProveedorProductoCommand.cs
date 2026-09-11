using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.Proveedores.EliminarProveedorProducto;

public sealed record EliminarProveedorProductoCommand(int IdProductoProveedor) : ICommand;
