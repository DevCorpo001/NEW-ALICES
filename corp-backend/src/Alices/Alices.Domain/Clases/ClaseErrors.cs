using Alices.Domain.Abstractions;

namespace Alices.Domain.Clases;

public static class ClaseErrors
{
    public static readonly Error YaExiste = new(
        "Clase.YaExiste",
        "Error al insertar. La Clase ya existe");
}
