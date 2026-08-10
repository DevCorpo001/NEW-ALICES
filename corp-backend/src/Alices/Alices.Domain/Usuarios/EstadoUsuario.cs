namespace Alices.Domain.Usuarios;

public record EstadoUsuario(string Value)
{
    public static readonly EstadoUsuario Activo = new("activo");
    public static readonly EstadoUsuario Inactivo = new("inactivo");
    public static readonly EstadoUsuario Suspendido = new("suspendido");
}
