using DotNetEnv;
using Npgsql;
using SistemaTic.Infrastructure;
using SistemaTic.Application;
using SistemaTic.Api;

Env.Load(FindEnvFile());

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDev", policy=>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
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
    string devSeedSql = await File.ReadAllTextAsync(FindDevSeedFile("002_dev_user.sql"));
    await using var devSeedCmd = dataSource.CreateCommand(devSeedSql);
    await devSeedCmd.ExecuteNonQueryAsync();
}

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
