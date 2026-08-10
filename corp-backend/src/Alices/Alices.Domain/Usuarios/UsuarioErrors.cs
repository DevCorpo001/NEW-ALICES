using Alices.Domain.Abstractions;

namespace Alices.Domain.Usuarios;

public static class UsuarioErrors
{
    public static readonly Error NotFound = new("Usuario.NotFound", "El usuario no existe");
    public static readonly Error CredencialesInvalidas = new("Usuario.CredencialesInvalidas", "Correo o contraseña incorrectos");
    public static readonly Error Inactivo = new("Usuario.Inactivo", "El usuario no está activo");
    public static readonly Error EmailDuplicado = new("Usuario.EmailDuplicado", "Ya existe un usuario con ese correo");
}
