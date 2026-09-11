using Alices.Domain.Abstractions;

namespace Alices.Domain.Familias;

public static class FamiliaErrors
{
    public static readonly Error YaExiste = new(
        "Familia.YaExiste",
        "Error al insertar. El código de Familia ya existe");
}
