using Bookstore.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Writable DB under ContentRoot/Data. Seed from (1) Bookstore.sqlite next to the app (Azure/publish output),
// or (2) repo-root Bookstore.sqlite when running from backend/Bookstore.Api locally.
var contentRoot = builder.Environment.ContentRootPath;
var dataDir = Path.Combine(contentRoot, "Data");
Directory.CreateDirectory(dataDir);
var localDbPath = Path.GetFullPath(Path.Combine(dataDir, "Bookstore.sqlite"));
var publishedSeedPath = Path.GetFullPath(Path.Combine(contentRoot, "Bookstore.sqlite"));
var devRepoRootSeedPath = Path.GetFullPath(Path.Combine(contentRoot, "..", "..", "Bookstore.sqlite"));

if (!File.Exists(localDbPath))
{
    var seedSource = File.Exists(publishedSeedPath)
        ? publishedSeedPath
        : File.Exists(devRepoRootSeedPath)
            ? devRepoRootSeedPath
            : null;
    if (seedSource != null)
    {
        File.Copy(seedSource, localDbPath);
    }
}

if (!File.Exists(localDbPath))
{
    throw new InvalidOperationException(
        "Bookstore.sqlite was not found or could not be created. " +
        "Expected a seed file at the app root (publish) or ../../Bookstore.sqlite (local dev).");
}

var dbPath = localDbPath;
builder.Services.AddDbContext<BookstoreContext>(options =>
{
    options.UseSqlite($"Data Source={dbPath}");
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        // This is intended for local development (React dev server).
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowReact");
app.MapControllers();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
