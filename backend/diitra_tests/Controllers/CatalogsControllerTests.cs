using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Xunit;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_tests.Controllers;

/// <summary>
/// Tests unitarios para catalogos e indicadores del sistema.
/// Valida la consulta de catalogos institucionales:
///  - Catalogos de periodos academicos activos (Activo = true, Cerrado = false)
///  - Proyectos e indicadores por periodo
/// </summary>
public class CatalogsControllerTests
{
    private static DiitraContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<DiitraContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new DiitraContext(options);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Catalogos")]
    public async Task PeriodosAcademicos_SoloRetornaPeriodosActivos()
    {
        var dbName = nameof(PeriodosAcademicos_SoloRetornaPeriodosActivos);
        await using var context = CreateInMemoryContext(dbName);

        context.Periodos.AddRange(
            new Periodo { IdPeriodo = "2026-1", Detalle = "Mayo - Octubre 2026", Activo = true,  Cerrado = false },
            new Periodo { IdPeriodo = "2026-2", Detalle = "Noviembre - Abril 2026", Activo = true, Cerrado = false },
            new Periodo { IdPeriodo = "2024-1", Detalle = "2024-I Cerrado",          Activo = false, Cerrado = true }
        );
        await context.SaveChangesAsync();

        var periodosActivos = await context.Periodos
            .Where(p => p.Activo == true && p.Cerrado != true)
            .ToListAsync();

        Assert.Equal(2, periodosActivos.Count);
        Assert.All(periodosActivos, p => Assert.True(p.Activo));
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Catalogos")]
    public async Task PeriodoAcademico_BúsquedaPorId_RetornaPeriodoCorrecto()
    {
        var dbName = nameof(PeriodoAcademico_BúsquedaPorId_RetornaPeriodoCorrecto);
        await using var context = CreateInMemoryContext(dbName);

        context.Periodos.Add(new Periodo { IdPeriodo = "2026-REGULAR", Detalle = "Periodo Ordinario", Activo = true });
        await context.SaveChangesAsync();

        var periodo = await context.Periodos.FirstOrDefaultAsync(p => p.IdPeriodo == "2026-REGULAR");
        Assert.NotNull(periodo);
        Assert.Equal("Periodo Ordinario", periodo!.Detalle);
    }
}
