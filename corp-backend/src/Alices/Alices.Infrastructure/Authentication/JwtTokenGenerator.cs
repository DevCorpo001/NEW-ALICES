using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Alices.Application.Abstractions.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Alices.Infrastructure.Authentication;

internal sealed class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtOptions _options;

    public JwtTokenGenerator(IOptions<JwtOptions> options)
    {
        _options = options.Value;
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
        var expiresAtUtc = DateTime.UtcNow.AddHours(_options.ExpirationHours);

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

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            _options.Issuer,
            _options.Audience,
            claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new AuthenticationToken(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAtUtc);
    }
}
