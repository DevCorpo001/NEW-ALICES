namespace Alices.Application.Abstractions.Clock;

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }

    /// <summary>
    /// Hora local de negocio (equivalente al GETDATE() que usaba el SP legacy).
    /// Hoy es la hora local del servidor; si el servidor cambia de zona horaria o
    /// se despliega en otra región, esto debe pasar a resolverse por TimeZoneInfo
    /// configurado explícitamente en vez de asumir la zona del SO.
    /// </summary>
    TimeOnly HoraLocal { get; }
}
