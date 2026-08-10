using Alices.Domain.Abstractions;

namespace Alices.Domain.Roles;

public sealed class Rol : Entity
{
    private Rol()
    {
    }

    private Rol(Guid id, string codigo, string nombre) : base(id)
    {
        Codigo = codigo;
        Nombre = nombre;
    }

    public string Codigo { get; private set; } = string.Empty;
    public string Nombre { get; private set; } = string.Empty;

    public static Rol Create(string codigo, string nombre)
    {
        return new Rol(Guid.NewGuid(), codigo, nombre);
    }

    public static Rol Create(Guid id, string codigo, string nombre)
    {
        return new Rol(id, codigo, nombre);
    }
}
