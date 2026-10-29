using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.Proveedores.AsociarProveedorProducto;

public sealed record AsociarProveedorProductoCommand(int IdProducto, int IdProveedor) : ICommand;
