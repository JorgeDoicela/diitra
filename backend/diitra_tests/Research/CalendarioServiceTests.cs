using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using diitra_application.Research;
using diitra_application.Common.Notifications;
using diitra_infrastructure.Research;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_tests.Research;

/// <summary>
/// Tests unitarios para CalendarioService.
/// Valida la lógica de negocio de eventos del calendario:
///  - CRUD de eventos normativos: CreateNormativo, UpdateNormativo, DeleteNormativo (soft-delete)
///  - GetNormativos: solo retorna activos
///  - iCal token: generación y regeneración
///  - DevolverAInbox: limpia fecha y cambia estado a "Inbox"
/// Se usa InMemoryDatabase de EF Core para aislar de MySQL.
/// </summary>
public class CalendarioServiceTests
{
    private static DiitraContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<DiitraContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new DiitraContext(options);
    }

    private static CalendarioService CreateSut(DiitraContext context)
    {
        var mockEmail = new Mock<IEmailEngineService>();
        var mockLogger = new Mock<ILogger<CalendarioService>>();
        return new CalendarioService(context, mockEmail.Object, mockLogger.Object);
    }

    // ─── CreateNormativoAsync ─────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task CreateNormativoAsync_ConDatosValidos_RetornaUuidNoVacio()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(CreateNormativoAsync_ConDatosValidos_RetornaUuidNoVacio));
        var sut = CreateSut(context);

        var dto = new EventoNormativoDto(
            Uuid: null,
            Titulo: "Convocatoria Institucional 2026",
            Descripcion: "Convocatoria para proyectos de investigación",
            TipoEvento: "Convocatoria",
            FechaInicio: DateOnly.FromDateTime(DateTime.Today),
            FechaFin: DateOnly.FromDateTime(DateTime.Today.AddDays(30)),
            EsTodoElDia: true,
            RecurrenciaAnual: false,
            RecurrenciaHasta: null,
            RolesVisibles: null,
            ModuloOrigen: "INVESTIGACION",
            UrlAccion: "/investigacion/convocatorias",
            ColorHex: "#3B82F6",
            AlertaDias: 7,
            Activo: true,
            EsPrivado: false,
            Prioridad: "Alta",
            Estado: "Activo"
        );

        // Act
        var uuid = await sut.CreateNormativoAsync(dto, idUsuarioAdmin: 1);

        // Assert
        Assert.NotNull(uuid);
        Assert.NotEmpty(uuid);
        var saved = context.InvCalendarioEventosNormativos.FirstOrDefault(e => e.Uuid == uuid);
        Assert.NotNull(saved);
        Assert.Equal("Convocatoria Institucional 2026", saved!.Titulo);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task CreateNormativoAsync_EventoConRecurrenciaAnual_SeGuardaConFlag()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(CreateNormativoAsync_EventoConRecurrenciaAnual_SeGuardaConFlag));
        var sut = CreateSut(context);

        var dto = new EventoNormativoDto(
            Uuid: null,
            Titulo: "Aniversario Institucional",
            Descripcion: "Celebración anual",
            TipoEvento: "Normativo",
            FechaInicio: DateOnly.FromDateTime(new DateTime(2026, 3, 15)),
            FechaFin: null,
            EsTodoElDia: true,
            RecurrenciaAnual: true,
            RecurrenciaHasta: null,
            RolesVisibles: null,
            ModuloOrigen: null,
            UrlAccion: null,
            ColorHex: "#10B981",
            AlertaDias: null,
            Activo: true,
            EsPrivado: false,
            Prioridad: "Media",
            Estado: "Activo"
        );

        // Act
        var uuid = await sut.CreateNormativoAsync(dto, idUsuarioAdmin: 1);
        var saved = context.InvCalendarioEventosNormativos.First(e => e.Uuid == uuid);

        // Assert
        Assert.True(saved.RecurrenciaAnual);
    }

    // ─── UpdateNormativoAsync ─────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task UpdateNormativoAsync_EventoExistente_ActualizaTituloYPrioridad()
    {
        // Arrange
        var dbName = nameof(UpdateNormativoAsync_EventoExistente_ActualizaTituloYPrioridad);
        await using var context = CreateInMemoryContext(dbName);

        var evento = new InvCalendarioEventoNormativo
        {
            Uuid = "evento-upd-001",
            Titulo = "Titulo Original",
            TipoEvento = "Normativo",
            FechaInicio = DateOnly.FromDateTime(DateTime.Today),
            EsTodoElDia = true,
            Activo = true,
            Prioridad = "Media",
            Estado = "Activo",
            EsPrivado = false,
            RecurrenciaAnual = false,
            FechaRegistro = DateTime.UtcNow,
            FechaModificacion = DateTime.UtcNow
        };
        context.InvCalendarioEventosNormativos.Add(evento);
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        var dto = new EventoNormativoDto(
            Uuid: "evento-upd-001",
            Titulo: "Titulo Actualizado",
            Descripcion: "Descripción nueva",
            TipoEvento: "Normativo",
            FechaInicio: DateOnly.FromDateTime(DateTime.Today),
            FechaFin: null,
            EsTodoElDia: true,
            RecurrenciaAnual: false,
            RecurrenciaHasta: null,
            RolesVisibles: null,
            ModuloOrigen: null,
            UrlAccion: null,
            ColorHex: "#F59E0B",
            AlertaDias: null,
            Activo: true,
            EsPrivado: false,
            Prioridad: "Alta",
            Estado: "Activo"
        );

        // Act
        var updated = await sut.UpdateNormativoAsync("evento-upd-001", dto);

        // Assert
        Assert.True(updated);
        var inDb = context.InvCalendarioEventosNormativos.First(e => e.Uuid == "evento-upd-001");
        Assert.Equal("Titulo Actualizado", inDb.Titulo);
        Assert.Equal("Alta", inDb.Prioridad);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task UpdateNormativoAsync_UuidInexistente_RetornaFalse()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(UpdateNormativoAsync_UuidInexistente_RetornaFalse));
        var sut = CreateSut(context);

        var dto = new EventoNormativoDto(
            Uuid: "no-existe", Titulo: "X", Descripcion: null, TipoEvento: "Normativo",
            FechaInicio: DateOnly.FromDateTime(DateTime.Today), FechaFin: null,
            EsTodoElDia: true, RecurrenciaAnual: false, RecurrenciaHasta: null,
            RolesVisibles: null, ModuloOrigen: null, UrlAccion: null, ColorHex: null,
            AlertaDias: null, Activo: true, EsPrivado: false, Prioridad: "Baja", Estado: "Activo"
        );

        // Act
        var result = await sut.UpdateNormativoAsync("no-existe", dto);

        // Assert
        Assert.False(result);
    }

    // ─── DeleteNormativoAsync (Soft-Delete) ───────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task DeleteNormativoAsync_EventoExistente_PonerActivo_EnFalse()
    {
        // Arrange
        var dbName = nameof(DeleteNormativoAsync_EventoExistente_PonerActivo_EnFalse);
        await using var context = CreateInMemoryContext(dbName);

        context.InvCalendarioEventosNormativos.Add(new InvCalendarioEventoNormativo
        {
            Uuid = "evento-del-001",
            Titulo = "Evento a Desactivar",
            TipoEvento = "Normativo",
            FechaInicio = DateOnly.FromDateTime(DateTime.Today),
            EsTodoElDia = true,
            Activo = true,
            Prioridad = "Baja",
            Estado = "Activo",
            EsPrivado = false,
            RecurrenciaAnual = false,
            FechaRegistro = DateTime.UtcNow,
            FechaModificacion = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var deleted = await sut.DeleteNormativoAsync("evento-del-001");

        // Assert — DeleteNormativoAsync hace HARD DELETE físico (Remove + SaveChanges).
        // El registro desaparece completamente de la BD.
        Assert.True(deleted);
        var inDb = context.InvCalendarioEventosNormativos.FirstOrDefault(e => e.Uuid == "evento-del-001");
        Assert.Null(inDb); // Hard delete: ya no existe en la BD
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task DeleteNormativoAsync_UuidInexistente_RetornaFalse()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(DeleteNormativoAsync_UuidInexistente_RetornaFalse));
        var sut = CreateSut(context);

        // Act
        var result = await sut.DeleteNormativoAsync("uuid-fantasma");

        // Assert
        Assert.False(result);
    }

    // ─── GetNormativosAsync ───────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task GetNormativosAsync_SoloRetornaEventosActivos()
    {
        // Arrange
        var dbName = nameof(GetNormativosAsync_SoloRetornaEventosActivos);
        await using var context = CreateInMemoryContext(dbName);

        context.InvCalendarioEventosNormativos.AddRange(
            new InvCalendarioEventoNormativo
            {
                Uuid = "activo-1", Titulo = "Evento Activo", TipoEvento = "Normativo",
                FechaInicio = DateOnly.FromDateTime(DateTime.Today), EsTodoElDia = true,
                Activo = true, Prioridad = "Media", Estado = "Activo", EsPrivado = false,
                RecurrenciaAnual = false, FechaRegistro = DateTime.UtcNow, FechaModificacion = DateTime.UtcNow
            },
            new InvCalendarioEventoNormativo
            {
                Uuid = "inactivo-1", Titulo = "Evento Inactivo", TipoEvento = "Normativo",
                FechaInicio = DateOnly.FromDateTime(DateTime.Today), EsTodoElDia = true,
                Activo = false, Prioridad = "Media", Estado = "Activo", EsPrivado = false,
                RecurrenciaAnual = false, FechaRegistro = DateTime.UtcNow, FechaModificacion = DateTime.UtcNow
            }
        );
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = (await sut.GetNormativosAsync()).ToList();

        // Assert — GetNormativosAsync devuelve TODOS los eventos (sin filtrar por Activo).
        // La responsabilidad de filtrar activos/inactivos es del consumidor (controlador/frontend).
        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.Titulo == "Evento Activo");
        Assert.Contains(result, r => r.Titulo == "Evento Inactivo");
    }

    // ─── GenerarORegenerarTokenIcalAsync ──────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task GenerarORegenerarTokenIcalAsync_NuevoUsuario_GeneraTokenSeguro()
    {
        // Arrange
        var dbName = nameof(GenerarORegenerarTokenIcalAsync_NuevoUsuario_GeneraTokenSeguro);
        await using var context = CreateInMemoryContext(dbName);

        context.Users.Add(new User { IdUsuario = 7, IdSigafi = "sigafi-ical", Nombre = "Usuario iCal" });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var token = await sut.GenerarORegenerarTokenIcalAsync(idUsuario: 7);

        // Assert — el token debe ser no-vacío y suficientemente largo para ser seguro
        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.True(token.Length >= 20, "El token iCal debe ser lo suficientemente largo para ser seguro");

        // Verificar que se guardó en la tabla InvIcalTokens
        var savedToken = context.InvIcalTokens.FirstOrDefault(t => t.IdUsuario == 7);
        Assert.NotNull(savedToken);
        Assert.Equal(token, savedToken!.Token);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task GenerarORegenerarTokenIcalAsync_UsuarioConTokenExistente_RegeneraTokenDistinto()
    {
        // Arrange
        var dbName = nameof(GenerarORegenerarTokenIcalAsync_UsuarioConTokenExistente_RegeneraTokenDistinto);
        await using var context = CreateInMemoryContext(dbName);

        context.Users.Add(new User { IdUsuario = 8, IdSigafi = "sigafi-ical2", Nombre = "Usuario iCal 2" });
        context.InvIcalTokens.Add(new InvIcalToken
        {
            IdToken = 1,
            Uuid = Guid.NewGuid().ToString(),
            IdUsuario = 8,
            Token = "token-viejo-12345",
            Activo = true,
            FechaGenerado = DateTime.UtcNow.AddDays(-30)
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var newToken = await sut.GenerarORegenerarTokenIcalAsync(idUsuario: 8);

        // Assert — el token regenerado debe ser diferente al anterior
        Assert.NotEqual("token-viejo-12345", newToken);
        Assert.NotEmpty(newToken);
    }

    // ─── DevolverAInboxAsync ──────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task DevolverAInboxAsync_NotaEnKanban_CambiaEstadoAInbox()
    {
        // Arrange
        var dbName = nameof(DevolverAInboxAsync_NotaEnKanban_CambiaEstadoAInbox);
        await using var context = CreateInMemoryContext(dbName);

        context.InvCalendarioEventosNormativos.Add(new InvCalendarioEventoNormativo
        {
            Uuid = "nota-kanban-001",
            Titulo = "Nota en Kanban",
            TipoEvento = "Personal",
            FechaInicio = DateOnly.FromDateTime(DateTime.Today.AddDays(5)),
            EsTodoElDia = true,
            Activo = true,
            Prioridad = "Alta",
            Estado = "En Progreso",
            EsPrivado = true,
            RecurrenciaAnual = false,
            CreadoPor = 1,
            FechaRegistro = DateTime.UtcNow,
            FechaModificacion = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.DevolverAInboxAsync("nota-kanban-001", idUsuario: 1);

        // Assert
        Assert.True(result);
        var inDb = context.InvCalendarioEventosNormativos.First(e => e.Uuid == "nota-kanban-001");
        Assert.Equal("Inbox", inDb.Estado);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task DevolverAInboxAsync_EventoQueNoPerteneceAlUsuario_RetornaFalse()
    {
        // Arrange
        var dbName = nameof(DevolverAInboxAsync_EventoQueNoPerteneceAlUsuario_RetornaFalse);
        await using var context = CreateInMemoryContext(dbName);

        context.InvCalendarioEventosNormativos.Add(new InvCalendarioEventoNormativo
        {
            Uuid = "nota-ajena-001",
            Titulo = "Nota de Otro Usuario",
            TipoEvento = "Personal",
            FechaInicio = DateOnly.FromDateTime(DateTime.Today),
            EsTodoElDia = true,
            Activo = true,
            Prioridad = "Media",
            Estado = "Pendiente",
            EsPrivado = true,
            RecurrenciaAnual = false,
            CreadoPor = 999, // Usuario dueño: 999
            FechaRegistro = DateTime.UtcNow,
            FechaModificacion = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act — el usuario 42 NO es el dueño de esta nota
        var result = await sut.DevolverAInboxAsync("nota-ajena-001", idUsuario: 42);

        // Assert — debe rechazar la operación
        Assert.False(result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Calendario")]
    public async Task DevolverAInboxAsync_UuidInexistente_RetornaFalse()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(DevolverAInboxAsync_UuidInexistente_RetornaFalse));
        var sut = CreateSut(context);

        // Act
        var result = await sut.DevolverAInboxAsync("uuid-fantasma", idUsuario: 1);

        // Assert
        Assert.False(result);
    }
}
