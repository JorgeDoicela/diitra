using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers;

/// <summary>
/// Administración de la rúbrica de evaluación por pares.
/// Los criterios se gestionan desde /admin/plantillas (RUBRICA_EVALUACION).
/// </summary>
[ApiController]
[Route("api/admin/rubrica")]
[Authorize]
public class RubricaAdminController : ControllerBase
{
    private readonly DiitraContext _context;

    public RubricaAdminController(DiitraContext context)
    {
        _context = context;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/rubrica
    // Devuelve la rúbrica activa con todos sus criterios ordenados.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetRubricaActiva(CancellationToken ct)
    {
        var rubrica = await _context.InvRubricas
            .Include(r => r.InvRubricaCriterios)
            .FirstOrDefaultAsync(r => r.Activo, ct);

        if (rubrica == null)
            return Ok(new RubricaAdminDto(0, "Rúbrica de Evaluación", Array.Empty<CriterioAdminDto>()));

        return Ok(new RubricaAdminDto(
            rubrica.IdRubrica,
            rubrica.Nombre,
            rubrica.InvRubricaCriterios
                .OrderBy(c => c.Orden ?? 0)
                .Select(c => new CriterioAdminDto(c.IdCriterio, c.Nombre, c.Descripcion, c.PesoPorcentaje, c.Orden ?? 0))
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/admin/rubrica/criterios
    // Reemplaza todos los criterios de la rúbrica activa.
    // Crea la rúbrica si no existe. Usa eliminación + reinserción para
    // simplificar la lógica de sincronización sin conflictos de PK.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPut("criterios")]
    public async Task<IActionResult> UpdateCriterios(
        [FromBody] UpdateCriteriosRequest request,
        CancellationToken ct)
    {
        if (request.Criterios == null || !request.Criterios.Any())
            return BadRequest(new { message = "Debe definir al menos un criterio." });

        await using var tx = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            // 1. Obtener o crear la rúbrica activa
            var rubrica = await _context.InvRubricas
                .Include(r => r.InvRubricaCriterios)
                .FirstOrDefaultAsync(r => r.Activo, ct);

            if (rubrica == null)
            {
                rubrica = new InvRubrica
                {
                    Nombre = "Rúbrica de Evaluación por Pares",
                    Descripcion = "Rúbrica institucional administrada desde el panel de plantillas.",
                    Activo = true,
                    FechaRegistro = DateTime.UtcNow
                };
                _context.InvRubricas.Add(rubrica);
                await _context.SaveChangesAsync(ct);
            }

            // 2. Eliminar criterios existentes (Cascade configurado en EF)
            _context.InvRubricaCriterios.RemoveRange(rubrica.InvRubricaCriterios);
            await _context.SaveChangesAsync(ct);

            // 3. Insertar nuevos criterios en el orden recibido
            var nuevos = request.Criterios
                .Select((c, idx) => new InvRubricaCriterio
                {
                    IdRubrica = rubrica.IdRubrica,
                    Nombre = c.Nombre.Trim(),
                    Descripcion = string.IsNullOrWhiteSpace(c.Descripcion) ? null : c.Descripcion.Trim(),
                    PesoPorcentaje = c.PesoMaximo,
                    Orden = idx
                })
                .ToList();

            _context.InvRubricaCriterios.AddRange(nuevos);
            await _context.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            // 4. Retornar la rúbrica actualizada
            return Ok(new RubricaAdminDto(
                rubrica.IdRubrica,
                rubrica.Nombre,
                nuevos.OrderBy(c => c.Orden)
                      .Select(c => new CriterioAdminDto(c.IdCriterio, c.Nombre, c.Descripcion, c.PesoPorcentaje, c.Orden ?? 0))
            ));
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

public record RubricaAdminDto(
    int IdRubrica,
    string Nombre,
    IEnumerable<CriterioAdminDto> Criterios
);

public record CriterioAdminDto(
    int? IdCriterio,
    string Nombre,
    string? Descripcion,
    decimal PesoMaximo,
    int Orden
);

public record UpdateCriteriosRequest(
    IEnumerable<CriterioAdminDto> Criterios
);
