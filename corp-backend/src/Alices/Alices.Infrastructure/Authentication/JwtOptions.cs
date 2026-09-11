namespace Alices.Infrastructure.Authentication;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret { get; init; } = string.Empty;

    public string Issuer { get; init; } = "Alices";

    public string Audience { get; init; } = "Alices";

    public int ExpirationHours { get; init; } = 8;
}
