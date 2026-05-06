using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.Collaboration;
using diitra_infrastructure.Security;
using diitra_application.Research;
using diitra_infrastructure.Research;
using diitra_application.Common;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using QuestPDF.Infrastructure;
// DIITRA Document Engine
using Diitra.Application.Common.Documents;
using Diitra.Infrastructure.Common.Documents;
using Diitra.Infrastructure.Common.Documents.Engine;

QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar CORS (Para que React y la APK entren)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                     ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("Diitra_policy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
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

// 2. Configurar JSON en snake_case y FluentValidation
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    });

// Registrar todos los validadores del ensamblado de Application
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<diitra_application.Security.Validators.LoginRequestValidator>();

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

// ── DIITRA Enterprise Document Engine ──────────────────────────────────────
// Motor principal: genera, combina y audita todos los documentos institucionales
builder.Services.AddScoped<IDocumentEngine, DocumentEngine>();
builder.Services.AddScoped<IDocumentTemplateRepository, DocumentTemplateRepository>();
builder.Services.AddScoped<IDocumentAuditRepository, DocumentAuditRepository>();
// Motor legado QuestPDF (mantenido para compatibilidad con reportes estadísticos)
builder.Services.AddScoped<Diitra.Application.Common.IDocumentGenerator, Diitra.Infrastructure.Common.DocumentGenerator>();
// ─────────────────────────────────────────────────────────────────────────────

// Application Services (Modular Monolith)
builder.Services.AddScoped<diitra_application.Security.IAuthService, diitra_infrastructure.Security.AuthService>();
builder.Services.AddScoped<diitra_application.Security.IAdminService, diitra_infrastructure.Security.AdminService>();
builder.Services.AddScoped<IResearchService, ProjectService>();
builder.Services.AddScoped<IPeerReviewService, PeerReviewService>();
builder.Services.AddScoped<IConvocatoriaService, ConvocatoriaService>();
builder.Services.AddScoped<IAIAssistantService, AIAssistantService>();
builder.Services.AddScoped<Diitra.Application.Research.IWorkflowEngineService, Diitra.Infrastructure.Research.WorkflowEngineService>();
builder.Services.AddScoped<Diitra.Application.Research.IPdfGeneratorService, Diitra.Infrastructure.Research.PdfGeneratorService>();

// 3. DATABASE CONNECTION
var connectionString = builder.Configuration.GetConnectionString("default_connection");


if (!string.IsNullOrEmpty(connectionString))
{
    // Usamos una versión fija para evitar que AutoDetect falle si la red parpadea
    var serverVersion = new MySqlServerVersion(new Version(8, 0, 31)); 
    builder.Services.AddDbContext<diitra_infrastructure.data.models.DiitraContext>(options =>
        options.UseMySql(connectionString, serverVersion));
}

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddSwaggerGen(c =>
{
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

    // Use Global Exception Middleware
    app.UseMiddleware<diitra_api.Middleware.ExceptionMiddleware>();

    // 1. CORS debe ser lo primero, antes de cualquier redirección o autenticación
    app.UseCors("Diitra_policy");

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment() || true) // Habilitar Swagger siempre por ahora
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseAuthentication(); 
    app.UseAuthorization();
    app.MapControllers();

    // SignalR Hubs (Unificado)
    app.MapHub<CollaborationHub>("/hubs/collaboration");

app.Run();

