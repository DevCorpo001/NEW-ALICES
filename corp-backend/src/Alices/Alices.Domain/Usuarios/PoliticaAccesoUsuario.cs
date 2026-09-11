using Alices.Domain.Abstractions;

namespace Alices.Domain.Usuarios;

/// <summary>
/// Reglas de negocio del SP legacy sp_Login_LogeoUsuarios (estado activo + ventana
/// horaria por rol), extraídas del SQL para que sean testeables. Servicio de dominio
/// concreto sin interfaz — no depende de ningún agregado persistido: recibe los datos
/// crudos que devuelva el origen de credenciales (hoy stored procedure, a futuro
/// IUsuarioRepository) y aplica la política.
/// </summary>
public sealed class PoliticaAccesoUsuario
{
    private static readonly TimeOnly InicioRestriccion = new(8, 50);
    private static readonly TimeOnly FinRestriccion = new(23, 59, 59);

    public Result Evaluar(
        bool usuarioActivo,
        string rolCodigo,
        TimeOnly horaLocal,
        IReadOnlyCollection<string> rolesSinRestriccionHoraria)
    {
        if (!usuarioActivo)
        {
            return Result.Failure(UsuarioErrors.Inactivo);
        }

        var exento = rolesSinRestriccionHoraria.Contains(rolCodigo, StringComparer.OrdinalIgnoreCase);
        if (!exento && !EnHorarioPermitido(horaLocal))
        {
            return Result.Failure(UsuarioErrors.FueraDeHorario);
        }

        return Result.Success();
    }

    private static bool EnHorarioPermitido(TimeOnly horaLocal) =>
        horaLocal >= InicioRestriccion && horaLocal <= FinRestriccion;
}
