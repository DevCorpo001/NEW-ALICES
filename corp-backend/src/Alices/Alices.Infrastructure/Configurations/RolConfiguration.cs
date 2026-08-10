using Alices.Domain.Roles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Alices.Infrastructure.Configurations;

internal sealed class RolConfiguration : IEntityTypeConfiguration<Rol>
{
    public void Configure(EntityTypeBuilder<Rol> builder)
    {
        builder.ToTable("roles");
        builder.HasKey(rol => rol.Id);

        builder.Property(rol => rol.Codigo)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(rol => rol.Nombre)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(rol => rol.Codigo).IsUnique();
    }
}
