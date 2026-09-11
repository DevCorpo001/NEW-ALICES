using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Alices.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <remarks>
    /// Elimina las tablas usuarios/roles creadas por la migración InicialSqlServer.
    /// Eran un padrón de identidad propio de ALICES que nunca llegó a usarse: el login
    /// real (IniciarSesionCommandHandler) autentica contra dbo.Usuario / dbo.Rol del
    /// sistema legacy, no contra estas tablas. Mantenerlas confundía — el admin sembrado
    /// aquí con BCrypt nunca pudo loguearse. Ver corp-backend/ARCHITECTURE.md y el plan
    /// de migración del login (Fase 1a).
    ///
    /// NO SE HA APLICADO a la base de datos (no se ejecutó "dotnet ef database update").
    /// Aplicar manualmente cuando se confirme que nada más depende de estas tablas.
    /// </remarks>
    public partial class EliminarPadronUsuariosFantasma : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "roles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    codigo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    contrasena_hash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    rol_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuarios", x => x.id);
                    table.ForeignKey(
                        name: "fk_usuarios_roles_rol_id",
                        column: x => x.rol_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_roles_codigo",
                table: "roles",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_email",
                table: "usuarios",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_rol_id",
                table: "usuarios",
                column: "rol_id");
        }
    }
}
