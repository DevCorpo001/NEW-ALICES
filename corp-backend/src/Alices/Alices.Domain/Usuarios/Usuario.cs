using Alices.Domain.Abstractions;
using Alices.Domain.Usuarios;

namespace Alices.Domain.Usuarios;

public sealed class Usuario : Entity
{
    private Usuario()
    {
    }

    private Usuario(
        Guid id,
        Nombre nombre,
        Email email,
        ContrasenaHash contrasenaHash,
        Guid rolId,
        EstadoUsuario estado) : base(id)
    {
        Nombre = nombre;
        Email = email;
        ContrasenaHash = contrasenaHash;
        RolId = rolId;
        Estado = estado;
    }

    public Nombre Nombre { get; private set; } = null!;
    public Email Email { get; private set; } = null!;
    public ContrasenaHash ContrasenaHash { get; private set; } = null!;

    /// <summary>
    /// Referencia al agregado Rol (FK). No embebe el rol completo.
    /// </summary>
    public Guid RolId { get; private set; }

    public EstadoUsuario Estado { get; private set; } = EstadoUsuario.Activo;

    public static Usuario Registrar(
        Nombre nombre,
        Email email,
        ContrasenaHash contrasenaHash,
        Guid rolId)
    {
        return new Usuario(
            Guid.NewGuid(),
            nombre,
            email,
            contrasenaHash,
            rolId,
            EstadoUsuario.Activo);
    }

    public bool EstaActivo() => Estado == EstadoUsuario.Activo;
}
