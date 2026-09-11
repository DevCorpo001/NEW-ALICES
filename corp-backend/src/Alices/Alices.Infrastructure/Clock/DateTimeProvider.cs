using Alices.Application.Abstractions.Clock;

namespace Alices.Infrastructure.Clock;

internal sealed class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;

    public TimeOnly HoraLocal => TimeOnly.FromDateTime(DateTime.Now);
}
