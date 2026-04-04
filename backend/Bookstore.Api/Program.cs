using Bookstore.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Writable DB file + seed copy. Azure App Service: use persistent dir under HOME (not always reliable under wwwroot).
var contentRoot = builder.Environment.ContentRootPath;
var baseDir = AppContext.BaseDirectory;

static string ResolveWritableDataDir(string contentRoot)
{
    var onAzure = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME"));
    if (onAzure)
    {
        var home = Environment.GetEnvironmentVariable("HOME");
        if (!string.IsNullOrEmpty(home))
        {
            return Path.Combine(home, "data", "bookstore");
        }

        // Windows App Service: persistent volume is often D:\home when HOME is unset.
        if (OperatingSystem.IsWindows() && Directory.Exists(@"D:\home"))
        {
            return Path.Combine(@"D:\home", "data", "bookstore");
        }
    }

    return Path.Combine(contentRoot, "Data");
}

string? FindSeedSqlite()
{
    foreach (var candidate in new[]
             {
                 Path.GetFullPath(Path.Combine(contentRoot, "Bookstore.sqlite")),
                 Path.GetFullPath(Path.Combine(baseDir, "Bookstore.sqlite")),
                 Path.GetFullPath(Path.Combine(contentRoot, "..", "..", "Bookstore.sqlite")),
             })
    {
        if (File.Exists(candidate) && new FileInfo(candidate).Length > 0)
        {
            return candidate;
        }
    }

    return null;
}

var dataDir = Path.GetFullPath(ResolveWritableDataDir(contentRoot));
Directory.CreateDirectory(dataDir);
var localDbPath = Path.Combine(dataDir, "Bookstore.sqlite");
var seedSource = FindSeedSqlite();

Console.WriteLine($"[Bookstore] ContentRoot={contentRoot}");
Console.WriteLine($"[Bookstore] BaseDirectory={baseDir}");
Console.WriteLine($"[Bookstore] DataDir={dataDir}");
Console.WriteLine($"[Bookstore] SeedSource={seedSource ?? "(none)"}");

if (seedSource != null)
{
    var needsCopy = !File.Exists(localDbPath)
                    || new FileInfo(localDbPath).Length < 1024; // empty/corrupt vs real ~24KB seed
    if (needsCopy)
    {
        File.Copy(seedSource, localDbPath, overwrite: true);
    }
}

if (!File.Exists(localDbPath))
{
    throw new InvalidOperationException(
        "Bookstore.sqlite seed not found. Checked ContentRoot, BaseDirectory, and ../../ from ContentRoot. " +
        "Ensure Bookstore.sqlite is published with the app (see .csproj Content CopyToPublishDirectory).");
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

// CORS must run after UseRouting so browser cross-origin requests get the right headers.
app.UseRouting();
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
