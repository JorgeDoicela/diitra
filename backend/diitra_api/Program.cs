using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.Collaboration;
using diitra_infrastructure.Security;
using diitra_application.Research;
using diitra_application.Common;
using diitra_infrastructure.hubs;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar CORS (Para que React y la APK entren)
builder.Services.AddCors(options =>
{
    options.AddPolicy("Diitra_policy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://192.168.7.50") // Tu PC y el servidor
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Obligatorio para SignalR
    });
});

// 2. Configurar JSON en snake_case
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    });

// 3. Agregar SignalR
builder.Services.AddSignalR();

// Infrastructure Services
builder.Services.AddScoped<IFirmaElectronicaService, FirmaElectronicaService>();
builder.Services.AddScoped<IExternalAuthService, ExternalAuthService>();

// Authorization Logic (PBAC)
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, PermissionHandler>();

builder.Services.AddAuthorization(options =>
{
    // Registrar automáticamente todas las constantes de Permissions como políticas
    var permissionFields = typeof(diitra_domain.Identity.Enums.Permissions)
        .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy)
        .Where(f => f.IsLiteral && !f.IsInitOnly);

    foreach (var field in permissionFields)
    {
        var permissionValue = field.GetValue(null)?.ToString();
        if (permissionValue != null)
        {
            options.AddPolicy(permissionValue, policy => 
                policy.Requirements.Add(new PermissionRequirement(permissionValue)));
        }
    }
});

// Application Services (Modular Monolith)
builder.Services.AddScoped<IResearchService, ProjectService>();
builder.Services.AddScoped<IPeerReviewService, PeerReviewService>();
builder.Services.AddScoped<IAIAssistantService, AIAssistantService>();

// Register Database Context
var connectionString = builder.Configuration.GetConnectionString("default_connection");
if (!string.IsNullOrEmpty(connectionString))
{
    // DiitraContext: Contexto LIMPIO con solo las tablas que Diitra necesita.
    // USAR ESTE en todos los servicios y controladores nuevos.
    builder.Services.AddDbContext<diitra_infrastructure.data.models.DiitraContext>(options =>
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
}

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Usar la política de CORS definida
app.UseCors("Diitra_policy");

app.UseAuthorization();

app.MapControllers();

// 4. Mapear el Hub de colaboración
app.MapHub<document_hub>("/hubs/documento");

// Mantener el anterior temporalmente si es necesario (opcional)
app.MapHub<DocumentHub>("/hubs/document");

app.Run();

