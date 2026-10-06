using DotNetEnv;
using Npgsql;
using SistemaTic.Infrastructure;
using SistemaTic.Application;
using SistemaTic.Api;
using SistemaTic.Api.Services;
using SistemaTic.Api.Serialization;
using SistemaTic.Api.ExceptionHandling;

Env.Load(FindEnvFile());

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new TimeOnlyJsonConverter());
    });
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddScoped<SoftexDocxExportService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDev", policy=>
    {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .WithExposedHeaders("Content-Disposition")
                .AllowAnyMethod();
    });  
});

builder.Services.AddJwtAuthentication(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    await using var scope = app.Services.CreateAsyncScope();
    var dataSource = scope.ServiceProvider.GetRequiredService<NpgsqlDataSource>();

    await using (var schemaGuardCmd = dataSource.CreateCommand(
        "SELECT to_regclass('public.users') IS NOT NULL AND to_regclass('public.roles') IS NOT NULL;"))
    {
        bool schemaReady = (bool)(await schemaGuardCmd.ExecuteScalarAsync())!;
        if (!schemaReady)
        {
            app.Logger.LogWarning("Banco ainda não migrado; dev seed 002_dev_user.sql pulado.");
        }
        else
        {
        string devSeedSql = await File.ReadAllTextAsync(FindDevSeedFile("002_dev_user.sql"));
        try
        {
            await using var devSeedCmd = dataSource.CreateCommand(devSeedSql);
            await devSeedCmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Dev seed 002_dev_user.sql não aplicado: {Message}", ex.Message);
        }
        }
    }
}

app.UseExceptionHandler();

app.UseCors("AngularDev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static string FindEnvFile()
{
    var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (dir != null)
    {
        var candidate = Path.Combine(dir.FullName, ".env");
        if (File.Exists(candidate)) return candidate;
        dir = dir.Parent;
    }
    throw new Exception(".env não encontrado em nenhum diretório");
}

static string FindDevSeedFile(string fileName)
{
    var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (dir != null)
    {
        var candidate = Path.Combine(dir.FullName, "database", "dev-seeds", fileName);
        if (File.Exists(candidate)) return candidate;
        dir = dir.Parent;
    }
    throw new Exception($"dev-seed {fileName} não encontrado em nenhum diretório");
}
