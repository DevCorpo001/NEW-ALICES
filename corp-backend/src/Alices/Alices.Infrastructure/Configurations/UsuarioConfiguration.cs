using Alices.Domain.Usuarios;
using Alices.Domain.Roles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Alices.Infrastructure.Configurations;

internal sealed class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios");
        builder.HasKey(usuario => usuario.Id);

        builder.Property(usuario => usuario.Nombre)
            .HasMaxLength(200)
            .HasConversion(nombre => nombre.Value, value => new Nombre(value));

        builder.Property(usuario => usuario.Email)
            .HasMaxLength(400)
            .HasConversion(email => email.Value, value => new Email(value));

        builder.Property(usuario => usuario.ContrasenaHash)
            .HasColumnName("contrasena_hash")
            .HasMaxLength(500)
            .HasConversion(hash => hash.Value, value => new ContrasenaHash(value));

        builder.Property(usuario => usuario.RolId)
            .HasColumnName("rol_id");

        builder.Property(usuario => usuario.Estado)
            .HasMaxLength(50)
            .HasConversion(estado => estado.Value, value => new EstadoUsuario(value));

        builder.HasIndex(usuario => usuario.Email).IsUnique();

        builder.HasOne<Rol>()
            .WithMany()
            .HasForeignKey(usuario => usuario.RolId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
