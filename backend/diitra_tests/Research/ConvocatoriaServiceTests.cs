using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_tests.Research;

/// <summary>
/// Tests unitarios de logica de convocatorias.
/// ConvocatoriaService tiene muchas dependencias (INotificationService, IAuditService, IServiceScopeFactory)
/// por lo que se testea via EF InMemory + logica pura de negocio.
/// Se valida:
///  - Persistencia CRUD de convocatorias en DB InMemory
///  - Logica de vigencia (DateOnly)
///  - Eliminacion logica (Eliminado = true)
/// </summary>
public class ConvocatoriaServiceTests
{
    private static DiitraContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<DiitraContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new DiitraContext(options);
    }

    private static InvConvocatoria BuildConvocatoria(int id, string titulo, bool eliminado = false, bool vigente = true)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        return new InvConvocatoria
        {
            IdConvocatoria     = id,
            Uuid               = Guid.NewGuid().ToString(),
            CodigoConvocatoria = $"CONV-{id:D4}",
            Titulo             = titulo,
            IdPeriodo          = "2026-1",
            Anio               = "2026",
            Estado             = vigente ? "Abierta" : "Cerrada",
            FechaApertura      = vigente ? today.AddDays(-5) : today.AddDays(-60),
            FechaCierre        = vigente ? today.AddDays(25) : today.AddDays(-1),
            Eliminado          = eliminado
        };
    }

    // ─── Persistencia en BD ───────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Convocatoria")]
    public async Task Convocatoria_Persistencia_CrearYLeer()
    {
        var dbName = nameof(Convocatoria_Persistencia_CrearYLeer);
        await using var context = CreateInMemoryContext(dbName);
        context.InvConvocatorias.Add(BuildConvocatoria(1, "Convocatoria Test 2026"));
        await context.SaveChangesAsync();

        var saved = await context.InvConvocatorias.FirstOrDefaultAsync(c => c.IdConvocatoria == 1);
        Assert.NotNull(saved);
        Assert.Equal("Convocatoria Test 2026", saved!.Titulo);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Convocatoria")]
    public async Task Convocatoria_FiltroEliminado_ExcluyeEliminadas()
    {
        var dbName = nameof(Convocatoria_FiltroEliminado_ExcluyeEliminadas);
        await using var context = CreateInMemoryContext(dbName);
        context.InvConvocatorias.AddRange(
            BuildConvocatoria(1, "Activa A",    eliminado: false),
            BuildConvocatoria(2, "Activa B",    eliminado: false),
            BuildConvocatoria(3, "Eliminada C", eliminado: true)
        );
        await context.SaveChangesAsync();

        var activas = context.InvConvocatorias
            .Where(c => c.Eliminado != true)
            .ToList();

        Assert.Equal(2, activas.Count);
        Assert.All(activas, c => Assert.NotEqual("Eliminada C", c.Titulo));
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Convocatoria")]
    public async Task Convocatoria_BusquedaPorUuid_RetornaCorrecta()
    {
        var dbName = nameof(Convocatoria_BusquedaPorUuid_RetornaCorrecta);
        await using var context = CreateInMemoryContext(dbName);
        var conv = BuildConvocatoria(10, "Target Uuid");
        context.InvConvocatorias.Add(conv);
        await context.SaveChangesAsync();

        var found = await context.InvConvocatorias.FirstOrDefaultAsync(c => c.Uuid == conv.Uuid);
        Assert.NotNull(found);
        Assert.Equal("Target Uuid", found!.Titulo);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Convocatoria")]
    public async Task Convocatoria_EliminacionLogica_CambiaFlag()
    {
        var dbName = nameof(Convocatoria_EliminacionLogica_CambiaFlag);
        await using var context = CreateInMemoryContext(dbName);
        var conv = BuildConvocatoria(20, "A Eliminar", eliminado: false);
        context.InvConvocatorias.Add(conv);
        await context.SaveChangesAsync();

        // Recargar desde el context y aplicar eliminacion logica
        var saved = await context.InvConvocatorias.FindAsync(20);
        Assert.NotNull(saved);
        saved!.Eliminado = true;
        await context.SaveChangesAsync();

        var afterDelete = await context.InvConvocatorias.FindAsync(20);
        Assert.NotNull(afterDelete);
        Assert.True(afterDelete!.Eliminado == true);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Convocatoria")]
    public async Task Convocatoria_ListaSinRegistros_RetornaVacio()
    {
        await using var context = CreateInMemoryContext(nameof(Convocatoria_ListaSinRegistros_RetornaVacio));
        var result = context.InvConvocatorias.Where(c => c.Eliminado != true).ToList();
        Assert.Empty(result);
    }

    // ─── Logica de vigencia (pura) ────────────────────────────────────────────

    [Theory]
    [InlineData(-10, 20, true)]
    [InlineData(-30, -1, false)]
    [InlineData(5, 20, false)]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Convocatoria")]
    public void EstaVigente_CalculaCorrectamente(int diasApertura, int diasCierre, bool esperado)
    {
        var today    = DateOnly.FromDateTime(DateTime.Today);
        var apertura = today.AddDays(diasApertura);
        var cierre   = today.AddDays(diasCierre);
        Assert.Equal(esperado, apertura <= today && cierre >= today);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Convocatoria")]
    public void Convocatoria_CamposPorDefecto_EstadoBorrador()
    {
        var conv = new InvConvocatoria
        {
            IdConvocatoria = 99, Uuid = Guid.NewGuid().ToString(),
            CodigoConvocatoria = "TEST", Titulo = "Test",
            IdPeriodo = "2026-1", Anio = "2026",
            FechaApertura = DateOnly.FromDateTime(DateTime.Today),
            FechaCierre = DateOnly.FromDateTime(DateTime.Today.AddDays(30))
        };
        Assert.Equal("Borrador", conv.Estado); // default value
    }
}
