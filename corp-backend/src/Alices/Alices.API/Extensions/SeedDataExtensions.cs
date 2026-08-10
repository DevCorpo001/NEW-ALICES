using Alices.Application.Abstractions.Authentication;
using Alices.Domain.Roles;
using Alices.Domain.Usuarios;
using Alices.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Alices.API.Extensions;

public static class SeedDataExtensions
{
    private static readonly Guid AdministradorRoleId =
        new("8d3e6b4e-6ef4-4a9c-9b2f-1d9c6d2f4a11");

    public static async Task SeedDataAsync(this IApplicationBuilder app)
    {
        await using var scope = app.ApplicationServices.CreateAsyncScope();
        var services = scope.ServiceProvider;
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher>();
        var configuration = services.GetRequiredService<IConfiguration>();

        var role = await dbContext.Set<Rol>().FindAsync(AdministradorRoleId);
        if (role is null)
        {
            role = Rol.Create(AdministradorRoleId, "ADMIN", "Administrador");
            dbContext.Add(role);
            await dbContext.SaveChangesAsync();
        }

        var email = configuration["Seed:AdminEmail"] ?? "admin@alices.local";
        var userExists = await dbContext.Set<Usuario>()
            .AnyAsync(usuario => usuario.Email == new Email(email));

        if (userExists)
        {
            return;
        }

        var password = configuration["Seed:AdminPassword"]
            ?? throw new InvalidOperationException("Seed:AdminPassword es obligatorio en Development");

        var usuario = Usuario.Registrar(
            new Nombre("Administrador"),
            new Email(email),
            new ContrasenaHash(passwordHasher.Hash(password)),
            role.Id);

        dbContext.Add(usuario);
        await dbContext.SaveChangesAsync();
    }
}
