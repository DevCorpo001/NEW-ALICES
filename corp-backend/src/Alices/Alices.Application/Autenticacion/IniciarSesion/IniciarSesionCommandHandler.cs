using Alices.Application.Abstractions.Authentication;
using Alices.Application.Abstractions.Data;
using Alices.Application.Abstractions.Messaging;
using Alices.Domain.Abstractions;
using Alices.Domain.Usuarios;
using Dapper;
using System.Data;

namespace Alices.Application.Autenticacion.IniciarSesion;

internal sealed class IniciarSesionCommandHandler
    : ICommandHandler<IniciarSesionCommand, IniciarSesionResponse>
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public IniciarSesionCommandHandler(
        ISqlConnectionFactory sqlConnectionFactory,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<Result<IniciarSesionResponse>> Handle(
        IniciarSesionCommand request,
        CancellationToken cancellationToken)
    {
        using var connection = _sqlConnectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@usuario", request.Usuario);
        parameters.Add("@clave", request.Clave);
        parameters.Add("@ip", request.Ip);
        parameters.Add("@idtienda", request.IdTienda);

        var credenciales = await connection.QueryFirstOrDefaultAsync<CredencialesUsuarioDto>(
            "dbo.sp_Login_LogeoUsuarios",
            parameters,
            commandType: CommandType.StoredProcedure);

        if (credenciales is null)
        {
            return Result.Failure<IniciarSesionResponse>(UsuarioErrors.CredencialesInvalidas);
        }

        var authenticationToken = _jwtTokenGenerator.Generate(
            credenciales.ID_USUARIO,
            credenciales.IDROL,
            credenciales.ROL,
            credenciales.ROL,
            credenciales.NOMBRECOMPLETO,
            request.Usuario,
            request.IdTienda,
            credenciales.rutavista);

        return new IniciarSesionResponse
        {
            Token = authenticationToken.AccessToken,
            UsuarioId = credenciales.ID_USUARIO,
            Nombre = credenciales.NOMBRECOMPLETO,
            RolId = credenciales.IDROL,
            RolCodigo = credenciales.ROL,
            RolNombre = credenciales.ROL,
            IdTienda = request.IdTienda,
            RutaVista = credenciales.rutavista,
            MaxSesiones = credenciales.MAX_SESIONES,
            ExpiraEn = authenticationToken.ExpiresAtUtc
        };
    }

    private sealed class CredencialesUsuarioDto
    {
        public string ID_USUARIO { get; init; } = string.Empty;
        public string USUARIO { get; init; } = string.Empty;
        public string CLAVE { get; init; } = string.Empty;
        public string NOMBRECOMPLETO { get; init; } = string.Empty;
        public string IDROL { get; init; } = string.Empty;
        public string ROL { get; init; } = string.Empty;
        public string? rutavista { get; init; }
        public int? MAX_SESIONES { get; init; }
    }
}
