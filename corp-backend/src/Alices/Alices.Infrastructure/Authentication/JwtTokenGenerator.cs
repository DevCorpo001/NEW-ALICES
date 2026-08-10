using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Alices.Application.Abstractions.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Alices.Infrastructure.Authentication;

internal sealed class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public AuthenticationToken Generate(
        string usuarioId,
        string rolId,
        string rolCodigo,
        string rolNombre,
        string nombre,
        string usuario,
        byte idTienda,
        string? rutaVista)
    {
        var secret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret no está configurado");
        var issuer = _configuration["Jwt:Issuer"] ?? "Alices";
        var audience = _configuration["Jwt:Audience"] ?? "Alices";
        var expirationHours = int.TryParse(_configuration["Jwt:ExpirationHours"], out var hours) ? hours : 8;
        var expiresAtUtc = DateTime.UtcNow.AddHours(expirationHours);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new("usuario", usuario),
            new(ClaimTypes.Name, nombre),
            new("rol_id", rolId.ToString()),
            new(ClaimTypes.Role, rolCodigo),
            new("rol_nombre", rolNombre),
            new("tienda_id", idTienda.ToString())
        };

        if (!string.IsNullOrWhiteSpace(rutaVista))
        {
            claims.Add(new Claim("ruta_vista", rutaVista));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new AuthenticationToken(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAtUtc);
    }
}
