using Bookstore.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Use a DB under ContentRoot/Data so writes work when the repo lives on a sync/read-only-prone path (e.g. iCloud Desktop).
// Seed from repo-root Bookstore.sqlite once if the local file is missing (Api lives under backend/Bookstore.Api).
var contentRoot = builder.Environment.ContentRootPath;
var dataDir = Path.Combine(contentRoot, "Data");
Directory.CreateDirectory(dataDir);
var localDbPath = Path.GetFullPath(Path.Combine(dataDir, "Bookstore.sqlite"));
var seedDbPath = Path.GetFullPath(Path.Combine(contentRoot, "..", "..", "Bookstore.sqlite"));
if (!File.Exists(localDbPath) && File.Exists(seedDbPath))
{
    File.Copy(seedDbPath, localDbPath);
}

var dbPath = File.Exists(localDbPath) ? localDbPath : seedDbPath;
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
