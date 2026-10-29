using System.Text;
using System.Threading.RateLimiting;
using Alices.API.Authentication;
using Alices.Application;
using Alices.Infrastructure;
using Alices.Infrastructure.Authentication;
using Alices.API.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Secretos locales (connection string real, Jwt:Secret) viven en
// appsettings.{Environment}.Local.json, gitignoreado — nunca se comitean.
// En despliegues reales, usar variables de entorno en su lugar.
builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.Local.json",
    optional: true,
    reloadOnChange: true);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddOptions<AuthCookieOptions>()
    .Bind(builder.Configuration.GetSection(AuthCookieOptions.SectionName));

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    // El proxy que termina TLS (nginx/IIS) debe estar declarado explícitamente en
    // producción vía Auth:ForwardedHeaders:KnownProxies; sin eso, ASP.NET Core solo
    // confía en localhost y descarta los headers de proxies externos por seguridad.
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((bearerOptions, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;

        bearerOptions.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrWhiteSpace(context.Token))
                {
                    context.Token = context.Request.Cookies["access_token"];
                }

                return Task.CompletedTask;
            }
        };
        bearerOptions.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    if (builder.Configuration.GetValue<bool>("Database:AutoMigrate"))
        await app.ApplyMigrationsAsync();

    app.MapOpenApi();
}

app.UseForwardedHeaders();
app.UseCors("Angular");
app.UseStaticFiles();
app.UseCustomExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapGet("/api/ping", () => Results.Ok(new
{
    Message = "Backend ALICES conectado correctamente",
    Timestamp = DateTime.UtcNow
}));

app.MapControllers();

app.Run();
