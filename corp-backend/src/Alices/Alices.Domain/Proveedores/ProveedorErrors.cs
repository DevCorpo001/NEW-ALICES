using Alices.Domain.Abstractions;

namespace Alices.Domain.Proveedores;

public static class ProveedorErrors
{
    public static readonly Error YaExiste = new(
        "Proveedor.YaExiste",
        "Error al insertar. El Proveedor ya existe");
}
