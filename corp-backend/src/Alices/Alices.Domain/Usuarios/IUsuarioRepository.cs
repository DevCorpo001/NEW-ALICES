namespace Alices.Domain.Usuarios;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Usuario?> GetByEmailAsync(Email email, CancellationToken cancellationToken = default);
    void Add(Usuario usuario);
}
