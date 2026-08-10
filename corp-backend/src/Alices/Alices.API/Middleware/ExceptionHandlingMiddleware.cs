using System.Net;
using Alices.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace Alices.API.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException validationException)
        {
            _logger.LogWarning("Error de validación en {Path}", context.Request.Path);

            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";

            var problem = new ValidationProblemDetails(
                validationException.Errors.ToDictionary(
                    error => error.PropertyName,
                    error => new[] { error.ErrorMessage }))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Error de validación"
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Error no controlado en {Path}", context.Request.Path);

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            await context.Response.WriteAsJsonAsync(new
            {
                title = "Error interno del servidor"
            });
        }
    }
}

public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseCustomExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
