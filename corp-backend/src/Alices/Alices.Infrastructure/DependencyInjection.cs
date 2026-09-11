using Alices.Application.Abstractions.Authentication;
using Alices.Application.Abstractions.Clock;
using Alices.Application.Abstractions.Data;
using Alices.Infrastructure.Authentication;
using Alices.Infrastructure.Clock;
using Alices.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Alices.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddTransient<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.Secret) && options.Secret.Length >= 32,
                "Jwt:Secret es obligatorio y debe tener al menos 32 caracteres")
            .ValidateOnStart();

        var connectionString = configuration.GetConnectionString("Database")
            ?? throw new ArgumentNullException(nameof(configuration), "ConnectionStrings:Database es obligatorio");

        services.AddSingleton<ISqlConnectionFactory>(_ => new SqlConnectionFactory(connectionString));

        return services;
    }
}
