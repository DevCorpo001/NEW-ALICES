using Alices.Domain.Abstractions;
using Alices.Domain.Usuarios;
using Microsoft.EntityFrameworkCore;

namespace Alices.Infrastructure.Repositories;

internal sealed class UsuarioRepository : IUsuarioRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UsuarioRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Usuario?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<Usuario>()
            .FirstOrDefaultAsync(usuario => usuario.Id == id, cancellationToken);
    }

    public async Task<Usuario?> GetByEmailAsync(Email email, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<Usuario>()
            .FirstOrDefaultAsync(usuario => usuario.Email == email, cancellationToken);
    }

    public void Add(Usuario usuario)
    {
        _dbContext.Add(usuario);
    }
}
