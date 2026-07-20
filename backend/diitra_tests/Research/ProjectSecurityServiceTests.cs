using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using Diitra.Application.Research;
using diitra_infrastructure.Research;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_tests.Research;

/// <summary>
/// Tests unitarios para ProjectSecurityService.
/// Valida las reglas de negocio de autorización sobre proyectos de investigación:
///  - Admin (Administrador = true) siempre puede ver y modificar
///  - Solo Director/Equipo puede modificar proyectos en estado editable (Borrador, En Corrección, Prepropuesta)
///  - Proyectos enviados/aprobados son de solo lectura para usuarios regulares
///  - PeerReviewer puede ver pero no modificar
///  - Usuarios inexistentes siempre reciben false
/// Se usan InMemory DB de EF Core para aislar completamente de MySQL.
/// </summary>
public class ProjectSecurityServiceTests
{
    private static DiitraContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<DiitraContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new DiitraContext(options);
    }

    // ─── UserCanModifyProjectAsync ────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanModifyProjectAsync_UsuarioNoExistente_RetornaFalse()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(UserCanModifyProjectAsync_UsuarioNoExistente_RetornaFalse));
        var mockQuery = new Mock<IProjectQueryService>();
        mockQuery.Setup(q => q.ResolveCanonicalUuidAsync(It.IsAny<string>())).ReturnsAsync((string?)null);

        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act — el usuario no existe en la BD en memoria
        var result = await sut.UserCanModifyProjectAsync("uuid-proyecto", "sigafi-inexistente");

        // Assert
        Assert.False(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanModifyProjectAsync_ProyectoEnviado_DenegaModificacionAUsuarioRegular()
    {
        // Arrange
        var dbName = nameof(UserCanModifyProjectAsync_ProyectoEnviado_DenegaModificacionAUsuarioRegular);
        await using var context = CreateInMemoryContext(dbName);

        var user = new User { IdUsuario = 1, IdSigafi = "sigafi-docente", Nombre = "Docente Test", Administrador = false };
        var proyecto = new InvProyecto
        {
            IdProyecto = 10,
            Uuid = "uuid-enviado",
            Estado = "Enviado",
            Titulo = "Proyecto Enviado",
            TieneGrupo = false
        };
        context.Users.Add(user);
        context.InvProyectos.Add(proyecto);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        mockQuery.Setup(q => q.ResolveCanonicalUuidAsync("uuid-enviado")).ReturnsAsync("uuid-enviado");

        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.UserCanModifyProjectAsync("uuid-enviado", "sigafi-docente");

        // Assert — "Enviado" no es estado modificable para usuarios regulares
        Assert.False(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanModifyProjectAsync_ProyectoBorrador_MiembroEquipo_RetornaTrue()
    {
        // Arrange
        var dbName = nameof(UserCanModifyProjectAsync_ProyectoBorrador_MiembroEquipo_RetornaTrue);
        await using var context = CreateInMemoryContext(dbName);

        var user = new User { IdUsuario = 2, IdSigafi = "sigafi-director", Nombre = "Director Test", Administrador = false };
        var proyecto = new InvProyecto
        {
            IdProyecto = 11,
            Uuid = "uuid-borrador",
            Estado = "Borrador",
            Titulo = "Proyecto en Borrador",
            TieneGrupo = false
        };
        var participante = new InvProyectoParticipante
        {
            IdParticipante = 1,
            IdProyecto = 11,
            IdUsuario = 2,
            Activo = true,
            Rol = "Director",
            TipoParticipante = "Docente",
            EsDirector = true
        };

        context.Users.Add(user);
        context.InvProyectos.Add(proyecto);
        context.InvProyectoParticipantes.Add(participante);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        mockQuery.Setup(q => q.ResolveCanonicalUuidAsync("uuid-borrador")).ReturnsAsync("uuid-borrador");

        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.UserCanModifyProjectAsync("uuid-borrador", "sigafi-director");

        // Assert — es miembro activo del equipo, proyecto en Borrador → puede modificar
        Assert.True(result);
    }

    [Theory]
    [InlineData("En Ejecución")]
    [InlineData("Aprobado")]
    [InlineData("Finalizado")]
    [InlineData("Rechazado")]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanModifyProjectAsync_EstadosNoEditables_RetornaFalse(string estado)
    {
        // Arrange
        var dbName = $"{nameof(UserCanModifyProjectAsync_EstadosNoEditables_RetornaFalse)}_{estado.Replace(" ", "_")}";
        await using var context = CreateInMemoryContext(dbName);

        var user = new User { IdUsuario = 5, IdSigafi = "sigafi-doc", Nombre = "Docente", Administrador = false };
        var proyecto = new InvProyecto { IdProyecto = 50, Uuid = "uuid-bloqueado", Estado = estado, Titulo = "T", TieneGrupo = false };
        var participante = new InvProyectoParticipante { IdParticipante = 5, IdProyecto = 50, IdUsuario = 5, Activo = true, TipoParticipante = "Docente" };

        context.Users.Add(user);
        context.InvProyectos.Add(proyecto);
        context.InvProyectoParticipantes.Add(participante);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        mockQuery.Setup(q => q.ResolveCanonicalUuidAsync("uuid-bloqueado")).ReturnsAsync("uuid-bloqueado");

        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.UserCanModifyProjectAsync("uuid-bloqueado", "sigafi-doc");

        // Assert
        Assert.False(result);
    }

    // ─── IsSystemAdminAsync ───────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task IsSystemAdminAsync_UsuarioConAdministradorTrue_RetornaTrue()
    {
        // Arrange
        var dbName = nameof(IsSystemAdminAsync_UsuarioConAdministradorTrue_RetornaTrue);
        await using var context = CreateInMemoryContext(dbName);

        // El flag Administrador = true es la forma más directa de tener acceso admin
        var admin = new User
        {
            IdUsuario = 99,
            IdSigafi = "sigafi-admin",
            Nombre = "Admin Sistema",
            Administrador = true
        };
        context.Users.Add(admin);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.IsSystemAdminAsync("sigafi-admin");

        // Assert
        Assert.True(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task IsSystemAdminAsync_UsuarioDocenteNormal_RetornaFalse()
    {
        // Arrange
        var dbName = nameof(IsSystemAdminAsync_UsuarioDocenteNormal_RetornaFalse);
        await using var context = CreateInMemoryContext(dbName);

        var docente = new User
        {
            IdUsuario = 50,
            IdSigafi = "sigafi-docente",
            Nombre = "Docente Test",
            Administrador = false
        };
        context.Users.Add(docente);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.IsSystemAdminAsync("sigafi-docente");

        // Assert
        Assert.False(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task IsSystemAdminAsync_UsuarioInexistente_RetornaFalse()
    {
        // Arrange
        var dbName = nameof(IsSystemAdminAsync_UsuarioInexistente_RetornaFalse);
        await using var context = CreateInMemoryContext(dbName);

        var mockQuery = new Mock<IProjectQueryService>();
        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.IsSystemAdminAsync("sigafi-fantasma");

        // Assert
        Assert.False(result);
    }

    // ─── IsProjectDirectorAsync ───────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task IsProjectDirectorAsync_DirectorDelProyecto_RetornaTrue()
    {
        // Arrange
        var dbName = nameof(IsProjectDirectorAsync_DirectorDelProyecto_RetornaTrue);
        await using var context = CreateInMemoryContext(dbName);

        var user = new User { IdUsuario = 10, IdSigafi = "sigafi-director", Nombre = "Director", Administrador = false };
        var proyecto = new InvProyecto { IdProyecto = 20, Uuid = "uuid-dir-test", Estado = "En Ejecución", Titulo = "Proyecto Test" };
        var participante = new InvProyectoParticipante
        {
            IdParticipante = 10,
            IdProyecto = 20,
            IdUsuario = 10,
            Rol = "Director",
            EsDirector = true,
            Activo = true,
            TipoParticipante = "Docente"
        };

        context.Users.Add(user);
        context.InvProyectos.Add(proyecto);
        context.InvProyectoParticipantes.Add(participante);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        mockQuery.Setup(q => q.ResolveCanonicalUuidAsync("uuid-dir-test")).ReturnsAsync("uuid-dir-test");

        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.IsProjectDirectorAsync("uuid-dir-test", "sigafi-director");

        // Assert
        Assert.True(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task IsProjectDirectorAsync_InvestigadorSinRolDirector_RetornaFalse()
    {
        // Arrange
        var dbName = nameof(IsProjectDirectorAsync_InvestigadorSinRolDirector_RetornaFalse);
        await using var context = CreateInMemoryContext(dbName);

        var user = new User { IdUsuario = 11, IdSigafi = "sigafi-invest", Nombre = "Investigador", Administrador = false };
        var proyecto = new InvProyecto { IdProyecto = 21, Uuid = "uuid-invest-test", Estado = "En Ejecución", Titulo = "Proyecto Test" };
        var participante = new InvProyectoParticipante
        {
            IdParticipante = 11,
            IdProyecto = 21,
            IdUsuario = 11,
            Rol = "Investigador",
            EsDirector = false,
            Activo = true,
            TipoParticipante = "Docente"
        };

        context.Users.Add(user);
        context.InvProyectos.Add(proyecto);
        context.InvProyectoParticipantes.Add(participante);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        mockQuery.Setup(q => q.ResolveCanonicalUuidAsync("uuid-invest-test")).ReturnsAsync("uuid-invest-test");

        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.IsProjectDirectorAsync("uuid-invest-test", "sigafi-invest");

        // Assert
        Assert.False(result);
    }

    // ─── UserCanViewProjectAsync ──────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanViewProjectAsync_MiembroEquipo_RetornaTrue()
    {
        // Arrange
        var dbName = nameof(UserCanViewProjectAsync_MiembroEquipo_RetornaTrue);
        await using var context = CreateInMemoryContext(dbName);

        var user = new User { IdUsuario = 30, IdSigafi = "sigafi-miembro", Nombre = "Miembro", Administrador = false };
        var proyecto = new InvProyecto { IdProyecto = 30, Uuid = "uuid-view-test", Estado = "Aprobado", Titulo = "Proyecto View Test", TieneGrupo = false };
        var participante = new InvProyectoParticipante { IdParticipante = 30, IdProyecto = 30, IdUsuario = 30, Activo = true, Rol = "Investigador", TipoParticipante = "Docente" };

        context.Users.Add(user);
        context.InvProyectos.Add(proyecto);
        context.InvProyectoParticipantes.Add(participante);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        mockQuery.Setup(q => q.ResolveCanonicalUuidAsync("uuid-view-test")).ReturnsAsync("uuid-view-test");

        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.UserCanViewProjectAsync("uuid-view-test", "sigafi-miembro");

        // Assert
        Assert.True(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task UserCanViewProjectAsync_UsuarioAjenoSinVinculacion_RetornaFalse()
    {
        // Arrange
        var dbName = nameof(UserCanViewProjectAsync_UsuarioAjenoSinVinculacion_RetornaFalse);
        await using var context = CreateInMemoryContext(dbName);

        var ajeno = new User { IdUsuario = 40, IdSigafi = "sigafi-ajeno", Nombre = "Ajeno", Administrador = false };
        var proyecto = new InvProyecto { IdProyecto = 40, Uuid = "uuid-privado", Estado = "En Ejecución", Titulo = "Proyecto Privado", TieneGrupo = false };

        context.Users.Add(ajeno);
        context.InvProyectos.Add(proyecto);
        await context.SaveChangesAsync();

        var mockQuery = new Mock<IProjectQueryService>();
        mockQuery.Setup(q => q.ResolveCanonicalUuidAsync("uuid-privado")).ReturnsAsync("uuid-privado");

        var sut = new ProjectSecurityService(context, mockQuery.Object);

        // Act
        var result = await sut.UserCanViewProjectAsync("uuid-privado", "sigafi-ajeno");

        // Assert
        Assert.False(result);
    }

    // ─── GetUserInternalIdBySigafiIdAsync ─────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task GetUserInternalIdBySigafiIdAsync_UsuarioExistente_RetornaIdInterno()
    {
        // Arrange
        var dbName = nameof(GetUserInternalIdBySigafiIdAsync_UsuarioExistente_RetornaIdInterno);
        await using var context = CreateInMemoryContext(dbName);

        context.Users.Add(new User { IdUsuario = 77, IdSigafi = "sigafi-77", Nombre = "Test User" });
        await context.SaveChangesAsync();

        var sut = new ProjectSecurityService(context, new Mock<IProjectQueryService>().Object);

        // Act
        var result = await sut.GetUserInternalIdBySigafiIdAsync("sigafi-77");

        // Assert
        Assert.Equal(77, result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "ProjectSecurity")]
    public async Task GetUserInternalIdBySigafiIdAsync_SigafiVacio_RetornaNull()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(GetUserInternalIdBySigafiIdAsync_SigafiVacio_RetornaNull));
        var sut = new ProjectSecurityService(context, new Mock<IProjectQueryService>().Object);

        // Act
        var result = await sut.GetUserInternalIdBySigafiIdAsync("");

        // Assert
        Assert.Null(result);
    }
}
