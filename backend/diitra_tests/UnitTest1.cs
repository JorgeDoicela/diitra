using System;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using diitra_infrastructure.Research;

namespace diitra_tests;

public class UnitTest1
{
    private async Task EnsureDatabaseColumnsExistAsync(DiitraContext context)
    {
        var statements = new[]
        {
            "ALTER TABLE inv_proyectos_profesores ADD COLUMN activo TINYINT(1) DEFAULT 1;",
            "ALTER TABLE inv_proyectos_profesores ADD COLUMN fecha_fin DATETIME NULL;",
            "ALTER TABLE inv_proyectos_profesores ADD COLUMN fecha_inicio DATETIME NULL;",
            "ALTER TABLE inv_proyectos_profesores ADD COLUMN motivo_cambio VARCHAR(150) NULL;",

            "ALTER TABLE inv_proyectos_alumnos ADD COLUMN activo TINYINT(1) DEFAULT 1;",
            "ALTER TABLE inv_proyectos_alumnos ADD COLUMN fecha_fin DATETIME NULL;",
            "ALTER TABLE inv_proyectos_alumnos ADD COLUMN fecha_inicio DATETIME NULL;",
            "ALTER TABLE inv_proyectos_alumnos ADD COLUMN motivo_cambio VARCHAR(150) NULL;",

            "ALTER TABLE inv_grupos_investigacion ADD COLUMN estado VARCHAR(20) DEFAULT 'Aprobado';"
        };

        foreach (var sql in statements)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(sql);
            }
            catch (Exception)
            {
                // Ignorar excepciones (ej: si la columna ya existe)
            }
        }
    }

    [Fact]
    public async Task TestProjectSync()
    {
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 31));
        optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=sigafi_es;User=root;Password=12345;", serverVersion);
        
        using var context = new DiitraContext(optionsBuilder.Options);
        
        // Ejecutar corrección de columnas antes de la prueba
        await EnsureDatabaseColumnsExistAsync(context);
        
        var mockAuth = new Mock<IAuthService>();
        var mockAudit = new Mock<IAuditService>();
        var mockNotification = new Mock<INotificationService>();
        var mockLogger = new Mock<ILogger<ProjectOrchestrator>>();
        
        // Mock user provisioning to return a dummy user if needed, or null
        mockAuth.Setup(a => a.GetOrProvisionUserByCedulaAsync(It.IsAny<string>()))
            .ReturnsAsync((diitra_domain.Identity.Entities.User?)null);
            
        var orchestrator = new ProjectOrchestrator(
            context,
            mockAuth.Object,
            mockAudit.Object,
            mockNotification.Object,
            mockLogger.Object
        );
        
        var dto = new ProyectoDto
        {
            Uuid = Guid.NewGuid().ToString(),
            Titulo = "TEST PROYECTO INTEGRATION",
            IdCarrera = 9, // Carrera válida: DESARROLLO DE SOFTWARE
            IdConvocatoria = 1,
            TieneGrupoInvestigacion = false,
            TrlInicial = 1,
            TrlActual = 1,
            TrlMeta = 1
        };
        
        var result = await orchestrator.SyncProjectWizardDataAsync(dto, "0302144159");
        
        Assert.True(result.Success, $"Sync failed: {result.Message}");
    }
}

