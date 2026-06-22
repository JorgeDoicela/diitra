using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Research.Dtos;
using Diitra.Application.Common.Documents;
using Microsoft.Extensions.Configuration;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using diitra_infrastructure.Research;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Diitra.Infrastructure.Common.Documents;
using diitra_api.Controllers;
using Diitra.Infrastructure.Common.Storage;

namespace diitra_tests;

public class UnitTest1
{
    private static readonly bool _skipTests = Environment.GetEnvironmentVariable("GITHUB_ACTIONS") == "true";

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

            "ALTER TABLE inv_grupos_investigacion ADD COLUMN estado VARCHAR(20) DEFAULT 'Aprobado';",
            "ALTER TABLE inv_proyectos ADD COLUMN autoExtendDeadlines TINYINT(1) DEFAULT 0;",
            "ALTER TABLE inv_proyectos ADD COLUMN autoExtendDays INT DEFAULT 7;"
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
        if (_skipTests) return;
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 31));
        optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=sigafi_es;User=root;Password=12345;", serverVersion);
        
        using var context = new DiitraContext(optionsBuilder.Options);
        await EnsureDatabaseColumnsExistAsync(context);
        
        var mockAuth = new Mock<IAuthService>();
        var mockAudit = new Mock<IAuditService>();
        var mockNotification = new Mock<INotificationService>();
        var mockLogger = new Mock<ILogger<ProjectOrchestrator>>();
        
        mockAuth.Setup(a => a.GetOrProvisionUserByCedulaAsync(It.IsAny<string>()))
            .ReturnsAsync((diitra_domain.Identity.Entities.User?)null);
            
        var orchestrator = new ProjectOrchestrator(
            context,
            mockAuth.Object,
            mockAudit.Object,
            mockNotification.Object,
            mockLogger.Object
        );
        
        string json = "{\"Titulo\":\"\",\"IdCarrera\":0,\"IdConvocatoria\":0,\"Periodo\":\"\",\"TiempoEjecucion\":\"\",\"Programa\":\"\",\"GrupoInvestigacionTipo\":\"NO\",\"GrupoInvestigacionNombre\":\"\",\"Dominio\":\"\",\"LineaInvestigacion\":\"\",\"SublineaInvestigacion\":\"\",\"TipoInvestigacion\":\"APLICADA\",\"CampoAmplio\":\"\",\"CampoEspecifico\":\"\",\"CampoDetallado\":\"\",\"DirectorProyecto\":\"\",\"FechaPresentacion\":\"\",\"FechaInicio\":\"\",\"FechaFin\":\"\",\"Investigadores\":[],\"Antecedentes\":\"\",\"DescripcionProyecto\":\"\",\"Justificacion\":\"\",\"ObjetivoGeneral\":\"\",\"ObjetivosEspecificos\":\"\",\"ObjetivosDesarrolloSostenible\":\"\",\"MarcoTeorico\":\"\",\"Metodologia\":\"\",\"Evaluacion\":\"\",\"RecursosDisponibles\":[],\"RecursosNecesarios\":[],\"CostoTotal\":0,\"FinanciamientoIstpet\":false,\"FinanciamientoOtrasFuentes\":false,\"NombresOtrasFuentes\":\"\",\"ProductosEsperados\":[],\"Impacto\":{\"social\":\"\",\"cientifico\":\"\",\"economico\":\"\",\"politico\":\"\",\"ambiental\":\"\",\"otro\":\"\"},\"Cronograma\":[{\"Actividad\":\"Actividad\",\"Numero\":0,\"RecursosNecesarios\":\"Actividad\",\"id\":\"rand_j5nicbi\"},{\"Actividad\":\"\",\"Numero\":1,\"RecursosNecesarios\":\"\",\"id\":\"rand_q2gywrb\"}],\"Bibliografia\":\"\",\"FirmasResponsabilidad\":{\"DirectorNombre\":\"\",\"DirectorCargo\":\"Director del Proyecto\",\"CoordinadorNombre\":\"\",\"CoordinadorCargo\":\"Coordinador de Carrera\"},\"Uuid\":\"7921b3de-9682-4595-81ff-b974bcb0149c\",\"EntityUuid\":\"c4515615-d3a5-44e0-998a-14111b2c8ebf\",\"entityUuid\":\"c4515615-d3a5-44e0-998a-14111b2c8ebf\"}";
        
        var options = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        var dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(json, options);
        Assert.NotNull(dto);
        dto.Uuid = "c4515615-d3a5-44e0-998a-14111b2c8ebf"; // Simulating the real EntityUuid mapping
        
        var result1 = await orchestrator.SyncProjectWizardDataAsync(dto, "0302144159");
        if (!result1.Success)
        {
            Console.WriteLine($"FIRST SYNC FAILURE: {result1.Message}");
        }
        Assert.True(result1.Success, $"First sync failed: {result1.Message}");

        // Modify a field and sync again
        dto.Titulo = "UPDATED TITLE FOR INTEGRATION TEST";
        var result2 = await orchestrator.SyncProjectWizardDataAsync(dto, "0302144159");
        if (!result2.Success)
        {
            Console.WriteLine($"SECOND SYNC FAILURE: {result2.Message}");
        }
        Assert.True(result2.Success, $"Second sync failed: {result2.Message}");
    }

    [Fact]
    public async Task TestPrintUserHours()
    {
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 31));
        optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=sigafi_es;User=root;Password=12345;", serverVersion);
        
        using var context = new DiitraContext(optionsBuilder.Options);
        
        var erikaUser = await context.Users.FirstOrDefaultAsync(u => u.IdSigafi == "1722528286");
        if (erikaUser == null)
        {
            Console.WriteLine("[DIAG] Erika user not found!");
            return;
        }
        Console.WriteLine($"[DIAG] Erika user: Id={erikaUser.IdUsuario}, Name='{erikaUser.Nombre}', Sigafi={erikaUser.IdSigafi}");

        var targetUuid = "c540e284-de03-409c-8ebe-0bb2d576278b";
        var project = await context.InvProyectos
            .Include(p => p.IdGrupoNavigation)
            .FirstOrDefaultAsync(p => p.Uuid == targetUuid);

        if (project == null)
        {
            Console.WriteLine($"[DIAG] Project {targetUuid} not found!");
            return;
        }

        Console.WriteLine($"[DIAG] Project: Id={project.IdProyecto}, Title='{project.Titulo}', TieneGrupo={project.TieneGrupo}, IdGrupo={project.IdGrupo}, GrupoNombre='{project.IdGrupoNavigation?.Nombre}', Estado='{project.Estado}'");

        // Erika's project assignment
        var assignment = await context.InvProyectosProfesores
            .FirstOrDefaultAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == erikaUser.IdUsuario);

        if (assignment != null)
        {
            Console.WriteLine($"[DIAG] Current Erika Assignment: Activo={assignment.Activo}, EsDirector={assignment.EsDirector}, Rol='{assignment.Rol}'");
            
            // Restore her access
            assignment.Activo = true;
            assignment.EsDirector = true;
            assignment.Rol = "Director de Proyecto";
            assignment.FechaFin = null;
            assignment.MotivoCambio = null;
            
            await context.SaveChangesAsync();
            Console.WriteLine("[DIAG] Erika's assignment restored and activated!");
        }
        else
        {
            Console.WriteLine("[DIAG] Erika assignment not found, creating it!");
            context.InvProyectosProfesores.Add(new InvProyectoProfesor
            {
                IdProyecto = project.IdProyecto,
                IdUsuario = erikaUser.IdUsuario,
                EsDirector = true,
                Rol = "Director de Proyecto",
                Activo = true,
                NivelAcademico = "Tercer Nivel",
                Telefono = ""
            });
            await context.SaveChangesAsync();
            Console.WriteLine("[DIAG] Erika assignment created and activated!");
        }
    }

    [Fact]
    public async Task TestAssignArbitroConflictOfInterest()
    {
        if (_skipTests) return;
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 31));
        optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=sigafi_es;User=root;Password=12345;", serverVersion);
        
        using var context = new DiitraContext(optionsBuilder.Options);
        await EnsureDatabaseColumnsExistAsync(context);

        var mockAudit = new Mock<IAuditService>();
        var mockDocEngine = new Mock<IDocumentEngine>();
        var mockNotification = new Mock<INotificationService>();
        var mockConfig = new Mock<IConfiguration>();
        var mockAuth = new Mock<IAuthService>();
        var mockWorkflow = new Mock<IWorkflowEngineService>();
        var mockLogger = new Mock<ILogger<PeerReviewService>>();
        var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();

        var service = new PeerReviewService(
            context,
            mockAudit.Object,
            mockDocEngine.Object,
            mockNotification.Object,
            mockConfig.Object,
            mockAuth.Object,
            mockWorkflow.Object,
            mockLogger.Object,
            mockHttpContextAccessor.Object
        );

        var uniqueProjUuid = Guid.NewGuid().ToString();
        var uniqueUserUuid = Guid.NewGuid().ToString();

        var user = new diitra_domain.Identity.Entities.User
        {
            IdSigafi = "TEST_PROF_" + uniqueUserUuid.Substring(0, 8),
            Nombre = "PROF TEST CONFLICT",
            Contrasenia = "hashed",
            Activo = true,
            TablaSigafi = "profesor"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var project = new InvProyecto
        {
            Uuid = uniqueProjUuid,
            Titulo = "PROYECTO TEST CONFLICT",
            Estado = "Enviado",
            Activo = true
        };
        context.InvProyectos.Add(project);
        await context.SaveChangesAsync();

        var projProf = new InvProyectoProfesor
        {
            IdProyecto = project.IdProyecto,
            IdUsuario = user.IdUsuario,
            EsDirector = true,
            Rol = "Director de Proyecto",
            Activo = true
        };
        context.Set<InvProyectoProfesor>().Add(projProf);
        await context.SaveChangesAsync();

        var assignDto = new AsignarArbitroDto
        {
            ProjectUuid = uniqueProjUuid,
            IdRevisor = user.IdUsuario,
            FechaLimite = DateTime.Now.AddDays(15),
            EsExterno = false,
            EsDobleCiego = true
        };

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            service.AsignarArbitroAsync(assignDto, 999)
        );

        Assert.Contains("Conflicto de interés", exception.Message);

        context.Set<InvProyectoProfesor>().Remove(projProf);
        context.InvProyectos.Remove(project);
        context.Users.Remove(user);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task TestFetchSnapshot()
    {
        if (_skipTests) return;
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 31));
        optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=sigafi_es;User=root;Password=12345;", serverVersion);
        
        using var context = new DiitraContext(optionsBuilder.Options);
        var instance = await context.DocumentInstances.FirstOrDefaultAsync(i => i.Uuid == "307c9503-d112-4545-b3c3-b7ba8655ddac");
        if (instance != null)
        {
            Console.WriteLine("SNAPSHOT JSON FOR 307c9503-d112-4545-b3c3-b7ba8655ddac:");
            Console.WriteLine(instance.DataSnapshotJson);
        }
        else
        {
            Console.WriteLine("INSTANCE NOT FOUND");
        }
    }

    [Fact]
    public async Task TestCheckProjectState()
    {
        if (_skipTests) return;
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 31));
        optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=sigafi_es;User=root;Password=12345;", serverVersion);
        
        using var context = new DiitraContext(optionsBuilder.Options);
        var project = await context.InvProyectos
            .Include(p => p.InvCronogramas).ThenInclude(c => c.InvCronogramaSemanas)
            .FirstOrDefaultAsync(p => p.Uuid == "c4515615-d3a5-44e0-998a-14111b2c8ebf");
            
        if (project != null)
        {
            Console.WriteLine($"PROJECT c4515615-d3a5-44e0-998a-14111b2c8ebf: Titulo='{project.Titulo}', Estado='{project.Estado}'");
            Console.WriteLine($"Activities count: {project.InvCronogramas.Count}");
            foreach (var act in project.InvCronogramas)
            {
                Console.WriteLine($"- Activity: Id={act.IdActividad}, Uuid={act.Uuid}, Desc='{act.Descripcion}', Orden={act.NumeroActividad}");
                Console.WriteLine($"  Weeks count: {act.InvCronogramaSemanas.Count}");
                foreach (var sem in act.InvCronogramaSemanas)
                {
                    Console.WriteLine($"    * Week: Id={sem.IdSemana}, Mes='{sem.Mes}', Semana={sem.Semana}");
                }
            }
        }
        else
        {
            Console.WriteLine("PROJECT NOT FOUND");
        }
    }

    [Fact]
    public async Task TestUpdateMetadataController()
    {
        if (_skipTests) return;
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 31));
        optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=sigafi_es;User=root;Password=12345;", serverVersion);
        
        using var context = new DiitraContext(optionsBuilder.Options);
        await EnsureDatabaseColumnsExistAsync(context);
        
        var mockAuth = new Mock<IAuthService>();
        var mockAudit = new Mock<IAuditService>();
        var mockNotification = new Mock<INotificationService>();
        var mockLoggerOrch = new Mock<ILogger<ProjectOrchestrator>>();
        
        mockAuth.Setup(a => a.GetOrProvisionUserByCedulaAsync(It.IsAny<string>()))
            .ReturnsAsync((diitra_domain.Identity.Entities.User?)null);
            
        var orchestrator = new ProjectOrchestrator(
            context,
            mockAuth.Object,
            mockAudit.Object,
            mockNotification.Object,
            mockLoggerOrch.Object
        );
        
        var mockStorage = new Mock<IFileStorageService>();
        var mockServiceProvider = new Mock<IServiceProvider>();
        mockServiceProvider.Setup(x => x.GetService(typeof(Diitra.Application.Research.IProjectOrchestrator)))
            .Returns(orchestrator);
            
        var instanceService = new DocumentInstanceService(context, mockStorage.Object, mockServiceProvider.Object);
        
        var mockEngine = new Mock<IDocumentEngine>();
        var mockDocOrch = new Mock<IDocumentDataOrchestrator>();
        var controller = new DocumentInstancesController(instanceService, mockEngine.Object, mockDocOrch.Object);
        
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "0302144159") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        
        string json = "{\"Titulo\":\"\",\"IdCarrera\":0,\"IdConvocatoria\":0,\"Periodo\":\"\",\"TiempoEjecucion\":\"\",\"Programa\":\"\",\"GrupoInvestigacionTipo\":\"NO\",\"GrupoInvestigacionNombre\":\"\",\"Dominio\":\"\",\"LineaInvestigacion\":\"\",\"SublineaInvestigacion\":\"\",\"TipoInvestigacion\":\"APLICADA\",\"CampoAmplio\":\"\",\"CampoEspecifico\":\"\",\"CampoDetallado\":\"\",\"DirectorProyecto\":\"\",\"FechaPresentacion\":\"\",\"FechaInicio\":\"\",\"FechaFin\":\"\",\"Investigadores\":[],\"Antecedentes\":\"\",\"DescripcionProyecto\":\"\",\"Justificacion\":\"\",\"ObjetivoGeneral\":\"\",\"ObjetivosEspecificos\":\"\",\"ObjetivosDesarrolloSostenible\":\"\",\"MarcoTeorico\":\"\",\"Metodologia\":\"\",\"Evaluacion\":\"\",\"RecursosDisponibles\":[],\"RecursosNecesarios\":[],\"CostoTotal\":0,\"FinanciamientoIstpet\":false,\"FinanciamientoOtrasFuentes\":false,\"NombresOtrasFuentes\":\"\",\"ProductosEsperados\":[],\"Impacto\":{\"social\":\"\",\"cientifico\":\"\",\"economico\":\"\",\"politico\":\"\",\"ambiental\":\"\",\"otro\":\"\"},\"Cronograma\":[{\"Actividad\":\"Actividad\",\"Numero\":0,\"RecursosNecesarios\":\"Actividad\",\"id\":\"rand_j5nicbi\",\"Semanas\":[true,false,true,false,false,false,false,false,false,false,false,false]},{\"Actividad\":\"\",\"Numero\":1,\"RecursosNecesarios\":\"\",\"id\":\"rand_q2gywrb\",\"Semanas\":[false,false,false,false,false,false,false,false,false,false,false,false]}],\"Bibliografia\":\"\",\"FirmasResponsabilidad\":{\"DirectorNombre\":\"\",\"DirectorCargo\":\"Director del Proyecto\",\"CoordinadorNombre\":\"\",\"CoordinadorCargo\":\"Coordinador de Carrera\"},\"Uuid\":\"7921b3de-9682-4595-81ff-b974bcb0149c\",\"EntityUuid\":\"c4515615-d3a5-44e0-998a-14111b2c8ebf\",\"entityUuid\":\"c4515615-d3a5-44e0-998a-14111b2c8ebf\"}";
        var jsonElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(json);
        
        var result1 = await controller.UpdateMetadata("7921b3de-9682-4595-81ff-b974bcb0149c", jsonElement, orchestrator, CancellationToken.None);
        var badRequest1 = result1 as BadRequestObjectResult;
        if (badRequest1 != null)
        {
            Console.WriteLine($"FIRST CONTROLLER CALL FAILED: {System.Text.Json.JsonSerializer.Serialize(badRequest1.Value)}");
        }
        else
        {
            Console.WriteLine("FIRST CONTROLLER CALL SUCCEEDED");
        }
        Assert.Null(badRequest1);
        
        var result2 = await controller.UpdateMetadata("7921b3de-9682-4595-81ff-b974bcb0149c", jsonElement, orchestrator, CancellationToken.None);
        var badRequest2 = result2 as BadRequestObjectResult;
        if (badRequest2 != null)
        {
            Console.WriteLine($"SECOND CONTROLLER CALL FAILED: {System.Text.Json.JsonSerializer.Serialize(badRequest2.Value)}");
        }
        else
        {
            Console.WriteLine("SECOND CONTROLLER CALL SUCCEEDED");
        }
        Assert.Null(badRequest2);
    }

    [Fact]
    public async Task TestDiagnoseDuplication()
    {
        var optionsBuilder = new DbContextOptionsBuilder<DiitraContext>();
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 31));
        optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=sigafi_es;User=root;Password=12345;", serverVersion);
        
        using var context = new DiitraContext(optionsBuilder.Options);
        var project = await context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid.StartsWith("0b0601fb"));
        if (project != null)
        {
            Console.WriteLine("DIAG PROJECT:");
            Console.WriteLine($"Uuid: {project.Uuid}");
            Console.WriteLine($"Titulo: {project.Titulo}");
            Console.WriteLine($"Metadata: {project.MetadataCacesJson}");

            var objectives = await context.InvObjetivosProyecto.Where(o => o.IdProyecto == project.IdProyecto).ToListAsync();
            Console.WriteLine($"Found {objectives.Count} InvObjetivosProyecto records for project Id {project.IdProyecto}:");
            foreach (var obj in objectives)
            {
                Console.WriteLine($"- Objective: Id={obj.IdObjetivo}, EsGeneral={obj.EsGeneral}, Orden={obj.Orden}, Descripcion='{obj.Descripcion}'");
            }

            var instances = await context.DocumentInstances.Where(i => i.EntityUuid == project.Uuid).ToListAsync();
            Console.WriteLine($"Found {instances.Count} DocumentInstances for project Uuid {project.Uuid}:");
            foreach (var instance in instances)
            {
                Console.WriteLine($"- Instance Uuid: {instance.Uuid}, State: {instance.State}");
                
                var coworkDocs = await context.InvCoworkDocumentos.Where(d => d.Uuid.StartsWith(instance.Uuid)).ToListAsync();
                Console.WriteLine($"  Found {coworkDocs.Count} CoWork docs starting with instance Uuid {instance.Uuid}:");
                foreach (var coworkDoc in coworkDocs)
                {
                    Console.WriteLine($"  * CoWork Doc Uuid: {coworkDoc.Uuid}");
                    Console.WriteLine($"    ContentHtml: {coworkDoc.ContentHtml}");
                    Console.WriteLine($"    ContentJson: {coworkDoc.ContentJson}");
                }
            }
        }
    }

    [Fact]
    public void TestHandlebarsStringEach()
    {
        var handlebars = HandlebarsDotNet.Handlebars.Create();
        var template = "{{#each objetivos_especificos}}<li>{{this}}</li>{{/each}}";
        var compiled = handlebars.Compile(template);

        var data = new Dictionary<string, object>
        {
            { "objetivos_especificos", "<p>Prueba</p>" }
        };

        var result = compiled(data);
        Console.WriteLine($"RENDER RESULT FOR STRING: '{result}'");
    }
}

