using Alices.Domain.Abstractions;

namespace Alices.Domain.Lineas;

public static class LineaErrors
{
    public static readonly Error YaExiste = new(
        "Linea.YaExiste",
        "Error al insertar. La Linea ya existe");
}
