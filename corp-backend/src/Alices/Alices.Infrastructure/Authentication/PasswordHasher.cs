using Alices.Application.Abstractions.Authentication;

namespace Alices.Infrastructure.Authentication;

internal sealed class PasswordHasher : IPasswordHasher
{
    public string Hash(string contrasenaPlana) => BCrypt.Net.BCrypt.HashPassword(contrasenaPlana);

    public bool Verify(string contrasenaPlana, string hash) =>
        BCrypt.Net.BCrypt.Verify(contrasenaPlana, hash);
}
