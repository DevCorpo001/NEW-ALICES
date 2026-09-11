using Microsoft.AspNetCore.Http;

namespace Alices.API.Authentication;

public sealed class AuthCookieOptions
{
    public const string SectionName = "Auth:Cookie";

    public bool Secure { get; init; } = true;

    public SameSiteMode SameSite { get; init; } = SameSiteMode.Lax;
}
