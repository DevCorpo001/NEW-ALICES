using Alices.Domain.Abstractions;

namespace Alices.Domain.Roles;

public static class RolErrors
{
    public static readonly Error NotFound = new("Rol.NotFound", "El rol no existe");
}
