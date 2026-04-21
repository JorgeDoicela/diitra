using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.Collaboration;
using diitra_infrastructure.Security;
using diitra_application.Research;
using diitra_application.Common;
using diitra_infrastructure.hubs;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar CORS (Para que React y la APK entren)
builder.Services.AddCors(options =>
{
    options.AddPolicy("Diitra_policy", policy =>
    {
        policy.WithOrigins("http://localhost:3002", "http://localhost:3000", "http://localhost:3001", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Obligatorio para SignalR
    });
});

// 1.1 Configurar Autenticación JWT y Cookies
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    
    // Configuración para leer el JWT desde una cookie
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            context.Token = context.Request.Cookies["diitra_auth"];
            return Task.CompletedTask;
        }
    };
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
builder.Services.AddScoped<diitra_application.Security.IAuthService, diitra_infrastructure.Security.AuthService>();
builder.Services.AddScoped<diitra_application.Security.IAdminService, diitra_infrastructure.Security.AdminService>();
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

try 
{
    Console.WriteLine("[STARTUP] Building application...");
    var app = builder.Build();

    Console.WriteLine("[STARTUP] Configuring middleware...");
    // 1. CORS debe ser lo primero, antes de cualquier redirección o autenticación
    app.UseCors("Diitra_policy");

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        Console.WriteLine("[STARTUP] Enabling OpenAPI for Development.");
        app.MapOpenApi();
    }

    app.UseAuthentication(); 
    app.UseAuthorization();
    app.MapControllers();

    // SignalR Hubs (Unificado)
    app.MapHub<DocumentHub>("/hubs/document");

    Console.WriteLine("[DIITRA] Server ONLINE on http://localhost:5175");
    Console.WriteLine("[DIITRA] Press Ctrl+C to stop.");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"[CRITICAL ERROR] Application failed to start: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"[INNER EXCEPTION] {ex.InnerException.Message}");
    }
    throw;
}

