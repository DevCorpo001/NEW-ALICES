using Alices.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Alices.API.Extensions;

public static class DatabaseExtensions
{
    public static async Task ApplyMigrationsAsync(this IApplicationBuilder app)
    {
        await using var scope = app.ApplicationServices.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.MigrateAsync();
    }
}
