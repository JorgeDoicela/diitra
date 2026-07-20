using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.Research;

namespace diitra_tests.Research;

/// <summary>
/// Tests unitarios para ProjectOrchestrator.
/// El orquestador es una fachada pura que delega a sub-servicios especializados.
/// Se testea que cada método delega correctamente al sub-servicio correspondiente
/// y que los parámetros fluyen de forma íntegra sin transformaciones.
/// </summary>
public class ProjectOrchestratorTests
{
    private readonly Mock<IProjectSecurityService> _mockSecurity;
    private readonly Mock<IProjectWizardService> _mockWizard;
    private readonly Mock<IProjectTeamService> _mockTeam;
    private readonly Mock<IProjectQueryService> _mockQuery;
    private readonly ProjectOrchestrator _sut; // System Under Test

    public ProjectOrchestratorTests()
    {
        _mockSecurity = new Mock<IProjectSecurityService>();
        _mockWizard   = new Mock<IProjectWizardService>();
        _mockTeam     = new Mock<IProjectTeamService>();
        _mockQuery    = new Mock<IProjectQueryService>();

        _sut = new ProjectOrchestrator(
            _mockSecurity.Object,
            _mockWizard.Object,
            _mockTeam.Object,
            _mockQuery.Object);
    }

    // ─── SyncProjectWizardDataAsync ───────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectWizard")]
    public async Task SyncProjectWizardDataAsync_DelegaAlWizardService_ConDtoYCreatorIdRef()
    {
        // Arrange
        var dto = new ProyectoDto { Titulo = "Proyecto Test", Estado = "Borrador" };
        var expectedResult = new SyncResult { Success = true, Uuid = "uuid-001" };
        _mockWizard
            .Setup(w => w.SyncProjectWizardDataAsync(dto, "user-123"))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _sut.SyncProjectWizardDataAsync(dto, "user-123");

        // Assert
        Assert.True(result.Success);
        Assert.Equal("uuid-001", result.Uuid);
        _mockWizard.Verify(w => w.SyncProjectWizardDataAsync(dto, "user-123"), Times.Once);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectWizard")]
    public async Task SyncProjectWizardDataAsync_SinCreatorRef_PasaNull()
    {
        // Arrange
        var dto = new ProyectoDto { Titulo = "Proyecto Sin Director" };
        _mockWizard
            .Setup(w => w.SyncProjectWizardDataAsync(dto, null))
            .ReturnsAsync(new SyncResult { Success = true, Uuid = "uuid-002" });

        // Act
        var result = await _sut.SyncProjectWizardDataAsync(dto);

        // Assert
        Assert.True(result.Success);
        _mockWizard.Verify(w => w.SyncProjectWizardDataAsync(dto, null), Times.Once);
    }

    // ─── GetAllProjectsAsync / GetMyProjectsAsync ─────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectQuery")]
    public async Task GetAllProjectsAsync_DelegaAlQueryService_RetornaLista()
    {
        // Arrange
        var expectedList = new List<ProyectoResumenDto>
        {
            new() { Uuid = "a", Titulo = "Proyecto A", Estado = "Aprobado" },
            new() { Uuid = "b", Titulo = "Proyecto B", Estado = "Borrador" },
        };
        _mockQuery.Setup(q => q.GetAllProjectsAsync()).ReturnsAsync(expectedList);

        // Act
        var result = await _sut.GetAllProjectsAsync();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Proyecto A", result[0].Titulo);
        _mockQuery.Verify(q => q.GetAllProjectsAsync(), Times.Once);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectQuery")]
    public async Task GetMyProjectsAsync_PasaUserIdReferencia_AlQueryService()
    {
        // Arrange
        var userId = "sigafi-999";
        _mockQuery
            .Setup(q => q.GetMyProjectsAsync(userId))
            .ReturnsAsync(new List<ProyectoResumenDto>
            {
                new() { Uuid = "x", Titulo = "Mi Proyecto", RolEnProyecto = "Director" }
            });

        // Act
        var result = await _sut.GetMyProjectsAsync(userId);

        // Assert
        Assert.Single(result);
        Assert.Equal("Director", result[0].RolEnProyecto);
        _mockQuery.Verify(q => q.GetMyProjectsAsync(userId), Times.Once);
    }

    // ─── GetProjectDetailAsync ────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectQuery")]
    public async Task GetProjectDetailAsync_UuidExistente_RetornaDto()
    {
        // Arrange
        var uuid = "uuid-detalle-001";
        var expectedDto = new ProyectoDto { Uuid = uuid, Titulo = "Proyecto Detallado" };
        _mockQuery.Setup(q => q.GetProjectDetailAsync(uuid)).ReturnsAsync(expectedDto);

        // Act
        var result = await _sut.GetProjectDetailAsync(uuid);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Proyecto Detallado", result!.Titulo);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectQuery")]
    public async Task GetProjectDetailAsync_UuidInexistente_RetornaNull()
    {
        // Arrange
        _mockQuery.Setup(q => q.GetProjectDetailAsync(It.IsAny<string>())).ReturnsAsync((ProyectoDto?)null);

        // Act
        var result = await _sut.GetProjectDetailAsync("no-existe");

        // Assert
        Assert.Null(result);
    }

    // ─── ResolveCanonicalUuidAsync ────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectQuery")]
    public async Task ResolveCanonicalUuidAsync_PrefijoCortoCorrecto_RetornaUuidCompleto()
    {
        // Arrange
        const string shortId = "abc123";
        const string fullUuid = "abc12345-0000-0000-0000-000000000000";
        _mockQuery.Setup(q => q.ResolveCanonicalUuidAsync(shortId)).ReturnsAsync(fullUuid);

        // Act
        var result = await _sut.ResolveCanonicalUuidAsync(shortId);

        // Assert
        Assert.Equal(fullUuid, result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectQuery")]
    public async Task ResolveCanonicalUuidAsync_IdentificadorInvalido_RetornaNull()
    {
        // Arrange
        _mockQuery.Setup(q => q.ResolveCanonicalUuidAsync("???")).ReturnsAsync((string?)null);

        // Act
        var result = await _sut.ResolveCanonicalUuidAsync("???");

        // Assert
        Assert.Null(result);
    }

    // ─── DeleteProjectAsync / PurgeProjectAsync / RestoreProjectAsync ─────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectLifecycle")]
    public async Task DeleteProjectAsync_DelegaAlWizardService()
    {
        // Arrange
        _mockWizard
            .Setup(w => w.DeleteProjectAsync("uuid-borrador", "admin-001"))
            .ReturnsAsync(new SyncResult { Success = true });

        // Act
        var result = await _sut.DeleteProjectAsync("uuid-borrador", "admin-001");

        // Assert
        Assert.True(result.Success);
        _mockWizard.Verify(w => w.DeleteProjectAsync("uuid-borrador", "admin-001"), Times.Once);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectLifecycle")]
    public async Task PurgeProjectAsync_DelegaAlWizardService()
    {
        // Arrange
        _mockWizard
            .Setup(w => w.PurgeProjectAsync("uuid-X", "admin-001"))
            .ReturnsAsync(new SyncResult { Success = true });

        // Act
        var result = await _sut.PurgeProjectAsync("uuid-X", "admin-001");

        // Assert
        Assert.True(result.Success);
        _mockWizard.Verify(w => w.PurgeProjectAsync("uuid-X", "admin-001"), Times.Once);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectLifecycle")]
    public async Task RestoreProjectAsync_DelegaAlWizardService()
    {
        // Arrange
        _mockWizard
            .Setup(w => w.RestoreProjectAsync("uuid-Y", "admin-001"))
            .ReturnsAsync(new SyncResult { Success = true, Uuid = "uuid-Y" });

        // Act
        var result = await _sut.RestoreProjectAsync("uuid-Y", "admin-001");

        // Assert
        Assert.True(result.Success);
        Assert.Equal("uuid-Y", result.Uuid);
    }

    // ─── UserCanModifyProjectAsync / UserCanViewProjectAsync ──────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanModifyProjectAsync_DirectorDelProyecto_RetornaTrue()
    {
        // Arrange
        _mockSecurity
            .Setup(s => s.UserCanModifyProjectAsync("uuid-proy", "director-sigafi"))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.UserCanModifyProjectAsync("uuid-proy", "director-sigafi");

        // Assert
        Assert.True(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanModifyProjectAsync_UsuarioAjeno_RetornaFalse()
    {
        // Arrange
        _mockSecurity
            .Setup(s => s.UserCanModifyProjectAsync("uuid-proy", "ajeno-sigafi"))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.UserCanModifyProjectAsync("uuid-proy", "ajeno-sigafi");

        // Assert
        Assert.False(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanViewProjectAsync_PeerReviewer_RetornaTrue()
    {
        // Arrange
        _mockSecurity
            .Setup(s => s.UserCanViewProjectAsync("uuid-proy", "reviewer-sigafi"))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.UserCanViewProjectAsync("uuid-proy", "reviewer-sigafi");

        // Assert
        Assert.True(result);
    }

    // ─── IsSystemAdminAsync / IsProjectDirectorAsync ──────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task IsSystemAdminAsync_AdminUser_RetornaTrue()
    {
        // Arrange
        _mockSecurity.Setup(s => s.IsSystemAdminAsync("admin-sigafi")).ReturnsAsync(true);

        // Act
        var result = await _sut.IsSystemAdminAsync("admin-sigafi");

        // Assert
        Assert.True(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task IsSystemAdminAsync_UsuarioNormal_RetornaFalse()
    {
        // Arrange
        _mockSecurity.Setup(s => s.IsSystemAdminAsync("docente-sigafi")).ReturnsAsync(false);

        // Act
        var result = await _sut.IsSystemAdminAsync("docente-sigafi");

        // Assert
        Assert.False(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task IsProjectDirectorAsync_DirectorActivo_RetornaTrue()
    {
        // Arrange
        _mockSecurity
            .Setup(s => s.IsProjectDirectorAsync("uuid-proy", "director-sigafi"))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.IsProjectDirectorAsync("uuid-proy", "director-sigafi");

        // Assert
        Assert.True(result);
    }

    // ─── TransferDirectorAsync ────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectTeam")]
    public async Task TransferDirectorAsync_ConDatosValidos_DelegaAlTeamService()
    {
        // Arrange
        var request = new TransferDirectorRequest
        {
            NuevoDirectorCedula = "1714567890",
            Motivo = "Licencia académica del director actual",
            Descripcion = "Transferencia aprobada por resolución 2026-001"
        };
        _mockTeam
            .Setup(t => t.TransferDirectorAsync("uuid-proy", request))
            .ReturnsAsync(new SyncResult { Success = true });

        // Act
        var result = await _sut.TransferDirectorAsync("uuid-proy", request);

        // Assert
        Assert.True(result.Success);
        _mockTeam.Verify(t => t.TransferDirectorAsync("uuid-proy", request), Times.Once);
    }

    // ─── UpdateProjectTeamAsync ───────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectTeam")]
    public async Task UpdateProjectTeamAsync_ListaDeInvestigadores_DelegaAlTeamService()
    {
        // Arrange
        var investigadores = new List<InvestigadorDto>
        {
            new() { Cedula = "1712345678", Nombre = "Dr. Luis Torres", Rol = "Director", EsDirector = true },
            new() { Cedula = "1798765432", Nombre = "Mg. Ana Ruiz", Rol = "Investigador" },
        };
        _mockTeam
            .Setup(t => t.UpdateProjectTeamAsync("uuid-proy", investigadores, "GIDI", true))
            .ReturnsAsync(new SyncResult { Success = true });

        // Act
        var result = await _sut.UpdateProjectTeamAsync("uuid-proy", investigadores, "GIDI", true);

        // Assert
        Assert.True(result.Success);
        _mockTeam.Verify(t => t.UpdateProjectTeamAsync("uuid-proy", investigadores, "GIDI", true), Times.Once);
    }

    // ─── GetProjectActivityAsync ──────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectActivity")]
    public async Task GetProjectActivityAsync_RetornaActividadLimitadaPorMaxItems()
    {
        // Arrange
        var actividades = new List<ProyectoActividadDto>
        {
            new() { Tipo = "workflow", NombreUsuario = "Admin", Descripcion = "Estado cambiado a Aprobado", Fecha = DateTime.UtcNow },
            new() { Tipo = "acceso", NombreUsuario = "Docente X", Descripcion = "Accedió al workspace", Fecha = DateTime.UtcNow },
        };
        _mockQuery
            .Setup(q => q.GetProjectActivityAsync("uuid-proy", 10))
            .ReturnsAsync(actividades);

        // Act
        var result = await _sut.GetProjectActivityAsync("uuid-proy", 10);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("workflow", result[0].Tipo);
        _mockQuery.Verify(q => q.GetProjectActivityAsync("uuid-proy", 10), Times.Once);
    }

    // ─── GetUserInternalIdBySigafiIdAsync ─────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task GetUserInternalIdBySigafiIdAsync_UsuarioExistente_RetornaId()
    {
        // Arrange
        _mockSecurity
            .Setup(s => s.GetUserInternalIdBySigafiIdAsync("sigafi-abc"))
            .ReturnsAsync(42);

        // Act
        var result = await _sut.GetUserInternalIdBySigafiIdAsync("sigafi-abc");

        // Assert
        Assert.Equal(42, result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task GetUserInternalIdBySigafiIdAsync_UsuarioNoExistente_RetornaNull()
    {
        // Arrange
        _mockSecurity
            .Setup(s => s.GetUserInternalIdBySigafiIdAsync("no-existe"))
            .ReturnsAsync((int?)null);

        // Act
        var result = await _sut.GetUserInternalIdBySigafiIdAsync("no-existe");

        // Assert
        Assert.Null(result);
    }

    // ─── CreateTeamChangeRequestAsync / GetTeamChangeRequestsAsync ────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TeamChangeRequest")]
    public async Task CreateTeamChangeRequestAsync_ConDatosValidos_DelegaAlTeamService()
    {
        // Arrange
        var request = new TeamChangeRequestDto
        {
            Tipo = "ALTA",
            CedulaObjetivo = "1712345678",
            RolPropuesto = "Investigador",
            Motivo = "Incorporación de nuevo docente al proyecto"
        };
        _mockTeam
            .Setup(t => t.CreateTeamChangeRequestAsync("uuid-proy", "requester-sigafi", request))
            .ReturnsAsync(new SyncResult { Success = true, Uuid = "req-uuid-001" });

        // Act
        var result = await _sut.CreateTeamChangeRequestAsync("uuid-proy", "requester-sigafi", request);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("req-uuid-001", result.Uuid);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TeamChangeRequest")]
    public async Task GetTeamChangeRequestsAsync_RetornaHistorial()
    {
        // Arrange
        var historial = new List<TeamChangeRequestRecordDto>
        {
            new()
            {
                RequestUuid = "req-001",
                Estado = "Pendiente",
                Tipo = "ALTA",
                Motivo = "Incorporación",
                FechaSolicitud = DateTime.UtcNow.AddDays(-2)
            }
        };
        _mockTeam
            .Setup(t => t.GetTeamChangeRequestsAsync("uuid-proy"))
            .ReturnsAsync(historial);

        // Act
        var result = await _sut.GetTeamChangeRequestsAsync("uuid-proy");

        // Assert
        Assert.Single(result);
        Assert.Equal("req-001", result[0].RequestUuid);
        Assert.Equal("Pendiente", result[0].Estado);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TeamChangeRequest")]
    public async Task ReviewTeamChangeRequestAsync_Aprobar_DelegaAlTeamService()
    {
        // Arrange
        var review = new TeamChangeReviewDto
        {
            Aprobar = true,
            Ejecutar = true,
            ResolucionAprobacion = "RES-2026-001",
            ObservacionRevision = "Aprobado según normativa interna"
        };
        _mockTeam
            .Setup(t => t.ReviewTeamChangeRequestAsync("uuid-proy", "req-001", "admin-sigafi", review))
            .ReturnsAsync(new SyncResult { Success = true });

        // Act
        var result = await _sut.ReviewTeamChangeRequestAsync("uuid-proy", "req-001", "admin-sigafi", review);

        // Assert
        Assert.True(result.Success);
        _mockTeam.Verify(
            t => t.ReviewTeamChangeRequestAsync("uuid-proy", "req-001", "admin-sigafi", review),
            Times.Once);
    }

    // ─── GetDashboardStatsAsync ───────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Dashboard")]
    public async Task GetDashboardStatsAsync_AdminRole_RetornaEstadisticasGlobales()
    {
        // Arrange
        var expectedStats = new DashboardStatsDto
        {
            TotalProyectos = 42,
            ProyectosEnEjecucion = 15,
            ProyectosBorrador = 10,
            TotalInvestigadoresActivos = 78,
        };
        _mockQuery
            .Setup(q => q.GetDashboardStatsAsync("admin-sigafi", true))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _sut.GetDashboardStatsAsync("admin-sigafi", true);

        // Assert
        Assert.Equal(42, result.TotalProyectos);
        Assert.Equal(15, result.ProyectosEnEjecucion);
        Assert.Equal(78, result.TotalInvestigadoresActivos);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Dashboard")]
    public async Task GetDashboardStatsAsync_DocenteRole_RetornaEstadisticasPersonales()
    {
        // Arrange
        var expectedStats = new DashboardStatsDto
        {
            MisProyectosActivos = 2,
            MisProyectosBorrador = 1,
            MisHorasInvestigacion = 12.5m,
        };
        _mockQuery
            .Setup(q => q.GetDashboardStatsAsync("docente-sigafi", false))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _sut.GetDashboardStatsAsync("docente-sigafi", false);

        // Assert
        Assert.Equal(2, result.MisProyectosActivos);
        Assert.Equal(12.5m, result.MisHorasInvestigacion);
    }
}
