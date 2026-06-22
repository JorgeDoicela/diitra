using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Diitra.Application.Common.Documents;
using Diitra.Application.Research;
using diitra_application.Research;
using System.Security.Claims;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IDocumentEngine _documentEngine;
        private readonly IProjectOrchestrator _projectOrchestrator;
        private readonly IGroupsService _groupsService;
        private readonly DiitraContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(
            IDocumentEngine documentEngine,
            IProjectOrchestrator projectOrchestrator,
            IGroupsService groupsService,
            DiitraContext context,
            ILogger<ReportsController> logger)
        {
            _documentEngine = documentEngine;
            _projectOrchestrator = projectOrchestrator;
            _groupsService = groupsService;
            _context = context;
            _logger = logger;
        }

        [HttpGet("analiticas")]
        [Authorize(Roles = "DIITRA_ADMIN")]
        public async Task<IActionResult> GenerateAnalyticsReport(
            [FromQuery] string? period = null,
            [FromQuery] string? carrera = null)
        {
            try
            {
                _logger.LogInformation("[DIITRA Reports] Generando reporte de analíticas. Periodo={Period}, Carrera={Carrera}", period, carrera);

                var isAdmin = User.FindFirst("es_admin")?.Value == "true";
                var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var projects = await _projectOrchestrator.GetAllProjectsAsync();
                var stats = await _projectOrchestrator.GetDashboardStatsAsync(userIdRef ?? "system", isAdmin);
                var groups = await _groupsService.GetAllAsync();

                var filteredProjects = projects.AsEnumerable();

                if (!string.IsNullOrEmpty(period) && period != "TODOS")
                {
                    filteredProjects = filteredProjects
                        .Where(p => p.ConvocatoriaTitulo != null &&
                                    p.ConvocatoriaTitulo.Contains(period, StringComparison.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrEmpty(carrera) && carrera != "TODAS")
                {
                    filteredProjects = filteredProjects
                        .Where(p => p.Carrera != null &&
                                    p.Carrera.Equals(carrera, StringComparison.OrdinalIgnoreCase));
                }

                var filteredList = filteredProjects.ToList();

                var stateColorsFromDb = await _context.InvConfigWorkflows
                    .Where(w => w.Activo && w.ColorHex != null)
                    .Select(w => new { w.EstadoDestino, w.ColorHex })
                    .Distinct()
                    .ToListAsync();

                var stateColors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["Borrador"] = "#6B7280",
                    ["Enviado"] = "#3B82F6",
                    ["En Revisión"] = "#F59E0B",
                    ["En Revision"] = "#F59E0B",
                    ["Aprobado"] = "#10B981",
                    ["En Ejecución"] = "#8B5CF6",
                    ["En Ejecucion"] = "#8B5CF6",
                    ["Finalizado"] = "#059669",
                    ["Rechazado"] = "#EF4444"
                };

                foreach (var dbColor in stateColorsFromDb)
                {
                    if (dbColor.EstadoDestino != null)
                    {
                        stateColors[dbColor.EstadoDestino] = dbColor.ColorHex!;
                    }
                }

                var estadosDistribucion = filteredList
                    .GroupBy(p => p.Estado ?? "Sin Estado")
                    .Select(g => new
                    {
                        estado = g.Key,
                        cantidad = g.Count(),
                        porcentaje = filteredList.Count > 0 ? Math.Round((double)g.Count() / filteredList.Count * 100, 1) : 0,
                        color = stateColors.ContainsKey(g.Key) ? stateColors[g.Key] : "#94A3B8"
                    })
                    .OrderByDescending(x => x.cantidad)
                    .ToList();

                var lineasDistribucion = filteredList
                    .Where(p => !string.IsNullOrEmpty(p.LineaInvestigacion))
                    .GroupBy(p => p.LineaInvestigacion!)
                    .Select(g => new
                    {
                        nombre = g.Key,
                        proyectos = g.Count(),
                        presupuesto = g.Sum(p => p.PresupuestoTotal ?? 0).ToString("N2")
                    })
                    .OrderByDescending(x => x.proyectos)
                    .ToList();

                var totalBudget = filteredList.Sum(p => p.PresupuestoTotal ?? 0);
                var executedBudget = filteredList.Sum(p => p.PresupuestoEjecutado ?? 0);
                var executionPct = totalBudget > 0 ? Math.Round(executedBudget / totalBudget * 100, 1) : 0;
                var configIndicadores = await _context.InvConfigIndicadores
                    .Where(i => i.Activo == true)
                    .ToDictionaryAsync(i => i.CodigoIndicador, StringComparer.OrdinalIgnoreCase);

                decimal GetUmbralC(string codigo, decimal fallback)
                {
                    if (configIndicadores.TryGetValue(codigo, out var cfg) && cfg.UmbralCumplido.HasValue)
                    {
                        return cfg.UmbralCumplido.Value;
                    }
                    _logger.LogWarning("[DIITRA Reports] Indicador CACES {Codigo} no está configurado en la base de datos (o no tiene UmbralCumplido). Usando fallback por defecto de {Fallback}.", codigo, fallback);
                    return fallback;
                }

                decimal GetUmbralP(string codigo, decimal fallback)
                {
                    if (configIndicadores.TryGetValue(codigo, out var cfg) && cfg.UmbralEnProceso.HasValue)
                    {
                        return cfg.UmbralEnProceso.Value;
                    }
                    _logger.LogWarning("[DIITRA Reports] Indicador CACES {Codigo} no está configurado en la base de datos (o no tiene UmbralEnProceso). Usando fallback por defecto de {Fallback}.", codigo, fallback);
                    return fallback;
                }

                var pndAligned = filteredList.Count(p => !string.IsNullOrEmpty(p.ObjetivoPnd));
                var pndPct = filteredList.Count > 0 ? Math.Round((double)pndAligned / filteredList.Count * 100, 1) : 0;
                var pndUmbralC = (double)GetUmbralC("E1.PLAN", 80);
                var pndUmbralP = (double)GetUmbralP("E1.PLAN", 50);
                var pndStatus = pndPct >= pndUmbralC ? "CUMPLIDO" : pndPct >= pndUmbralP ? "EN PROCESO" : "ALERTA";

                var totalProd = filteredList.Sum(p => p.TotalProductos);
                var researchers = stats.TotalInvestigadoresActivos > 0 ? stats.TotalInvestigadoresActivos : stats.MisProyectosActivos;
                var prodRate = researchers > 0 ? (double)totalProd / researchers : 0;
                var prodReferencia = configIndicadores.TryGetValue("E2.PROD", out var prodCfg) && prodCfg.ValorReferencia.HasValue ? (double)prodCfg.ValorReferencia.Value : 0.5;
                var prodPct = Math.Round(prodRate / (prodReferencia > 0 ? prodReferencia : 0.5) * 100, 1);
                prodPct = Math.Min(prodPct, 100);
                var prodUmbralC = (double)GetUmbralC("E2.PROD", 100);
                var prodUmbralP = (double)GetUmbralP("E2.PROD", 50);
                var prodStatus = prodPct >= prodUmbralC ? "CUMPLIDO" : prodPct >= prodUmbralP ? "EN PROCESO" : "ALERTA";

                var trlMinimo = 5;
                var trlConfigRaw = await _context.InvConfigsGenerales
                    .Where(c => c.Clave == "Caces.TrlMinimoInnovacion")
                    .Select(c => c.Valor)
                    .FirstOrDefaultAsync();
                if (int.TryParse(trlConfigRaw, out var trlVal))
                {
                    trlMinimo = trlVal;
                }
                var withTrlOrPartner = filteredList.Count(p => (p.TrlActual.HasValue && p.TrlActual >= trlMinimo) || !string.IsNullOrEmpty(p.EntidadAliada));
                var innovPct = filteredList.Count > 0 ? Math.Round((double)withTrlOrPartner / filteredList.Count * 100, 1) : 0;
                var innovUmbralC = (double)GetUmbralC("E3.INNO", 15);
                var innovUmbralP = (double)GetUmbralP("E3.INNO", 7.5m);
                var innovStatus = innovPct >= innovUmbralC ? "CUMPLIDO" : innovPct >= innovUmbralP ? "EN PROCESO" : "ALERTA";
                innovPct = Math.Min(innovPct, 100);

                var withStudents = filteredList.Count(p => p.TotalEstudiantes > 0);
                var studPct = filteredList.Count > 0 ? Math.Round((double)withStudents / filteredList.Count * 100, 1) : 0;
                var studUmbralC = (double)GetUmbralC("E4.STUD", 30);
                var studUmbralP = (double)GetUmbralP("E4.STUD", 15);
                var studStatus = studPct >= studUmbralC ? "CUMPLIDO" : studPct >= studUmbralP ? "EN PROCESO" : "ALERTA";
                studPct = Math.Min(studPct, 100);

                var budgetPct = (double)executionPct;
                var budgetUmbralC = (double)GetUmbralC("E5.BUDG", 75);
                var budgetUmbralP = (double)GetUmbralP("E5.BUDG", 40);
                var budgetStatus = budgetPct >= budgetUmbralC ? "CUMPLIDO" : budgetPct >= budgetUmbralP ? "EN PROCESO" : "ALERTA";
                budgetPct = Math.Min(budgetPct, 100);

                var indicadoresCaces = new List<object>
                {
                    new { codigo = "E1.PLAN", nombre = "Alineación PND y POA", descripcion = "Proyectos alineados al Plan Nacional de Desarrollo", progreso = (double)pndPct, meta = $"≥{pndUmbralC}%", estado = pndStatus, badge_class = pndStatus == "CUMPLIDO" ? "badge-success" : pndStatus == "EN PROCESO" ? "badge-warning" : "badge-danger", bar_color = pndStatus == "CUMPLIDO" ? "green" : pndStatus == "EN PROCESO" ? "amber" : "red", valor_actual = $"{pndAligned} de {filteredList.Count} proyectos alineados" },
                    new { codigo = "E2.PROD", nombre = "Producción Científica del Claustro", descripcion = $"Tasa de publicaciones: {prodRate:F1}/investigador (meta: {prodReferencia:F1})", progreso = (double)prodPct, meta = $"≥{prodReferencia:F1} pub/invest.", estado = prodStatus, badge_class = prodStatus == "CUMPLIDO" ? "badge-success" : prodStatus == "EN PROCESO" ? "badge-warning" : "badge-danger", bar_color = prodStatus == "CUMPLIDO" ? "green" : prodStatus == "EN PROCESO" ? "amber" : "red", valor_actual = $"{totalProd} productos de {researchers} investigadores" },
                    new { codigo = "E3.INNO", nombre = "Innovación y Transferencia Tecnológica", descripcion = $"Proyectos con TRL≥{trlMinimo} o entidad aliada", progreso = (double)innovPct, meta = $"≥{innovUmbralC}%", estado = innovStatus, badge_class = innovStatus == "CUMPLIDO" ? "badge-success" : innovStatus == "EN PROCESO" ? "badge-warning" : "badge-danger", bar_color = innovStatus == "CUMPLIDO" ? "green" : innovStatus == "EN PROCESO" ? "amber" : "red", valor_actual = $"{withTrlOrPartner} de {filteredList.Count} proyectos innovadores" },
                    new { codigo = "E4.STUD", nombre = "Vinculación Formativa (Semilleros)", descripcion = "Proyectos con participación estudiantil", progreso = (double)studPct, meta = $"≥{studUmbralC}%", estado = studStatus, badge_class = studStatus == "CUMPLIDO" ? "badge-success" : studStatus == "EN PROCESO" ? "badge-warning" : "badge-danger", bar_color = studStatus == "CUMPLIDO" ? "green" : studStatus == "EN PROCESO" ? "amber" : "red", valor_actual = $"{withStudents} de {filteredList.Count} proyectos con estudiantes" },
                    new { codigo = "E5.BUDG", nombre = "Ejecución Presupuestaria", descripcion = "Eficiencia en el uso de recursos asignados", progreso = (double)budgetPct, meta = $"≥{budgetUmbralC}%", estado = budgetStatus, badge_class = budgetStatus == "CUMPLIDO" ? "badge-success" : budgetStatus == "EN PROCESO" ? "badge-warning" : "badge-danger", bar_color = budgetStatus == "CUMPLIDO" ? "green" : budgetStatus == "EN PROCESO" ? "amber" : "red", valor_actual = $"${executedBudget:N0} de ${totalBudget:N0} ejecutados" }
                };

                var proyectosTabla = filteredList.Select(p =>
                {
                    var estadoLower = (p.Estado ?? "").ToLower();
                    var badge = estadoLower switch
                    {
                        "aprobado" => "badge-success",
                        "en ejecución" or "en ejecucion" => "badge-success",
                        "finalizado" => "badge-success",
                        "en revisión" or "en revision" => "badge-warning",
                        "enviado" => "badge-neutral",
                        _ => "badge-neutral"
                    };
                    return new
                    {
                        codigo = p.CodigoInstitucional ?? $"IST-{p.IdProyecto:D3}",
                        titulo = p.Titulo ?? "Sin título",
                        linea = p.LineaInvestigacion ?? "General",
                        presupuesto = (p.PresupuestoTotal ?? 0).ToString("N2"),
                        estudiantes = p.TotalEstudiantes,
                        productos = p.TotalProductos,
                        estado = p.Estado ?? "Sin estado",
                        estado_badge = badge,
                        entidad_aliada = p.EntidadAliada
                    };
                }).ToList();

                var consolidatedGroups = groups.Count(g =>
                    g.CategoriaConsolidacion?.Contains("Consolid", StringComparison.OrdinalIgnoreCase) == true ||
                    g.CategoriaConsolidacion?.Contains("A", StringComparison.OrdinalIgnoreCase) == true);

                var periodLabel = string.IsNullOrEmpty(period) || period == "TODOS" ? "Todos los Periodos" : period;
                var carreraLabel = string.IsNullOrEmpty(carrera) || carrera == "TODAS" ? "Todas las Tecnologías" : carrera;

                var reportData = new
                {
                    periodo = periodLabel,
                    carrera = carreraLabel,
                    fecha_generacion = DateTime.Now.ToString("dd/MM/yyyy HH:mm"),
                    generado_por = User.Identity?.Name ?? "Sistema DIITRA",
                    total_proyectos = filteredList.Count,
                    proyectos_ejecucion = filteredList.Count(p => p.Estado?.ToLower() == "en ejecución" || p.Estado?.ToLower() == "en ejecucion"),
                    proyectos_borrador = filteredList.Count(p => p.Estado?.ToLower() == "borrador"),
                    total_productos = totalProd,
                    articulos_indexados = stats.ArticulosIndexados,
                    prototipos = stats.Prototipos,
                    presupuesto_total = $"${totalBudget:N0}",
                    presupuesto_ejecutado = $"${executedBudget:N0}",
                    porcentaje_ejecucion = executionPct,
                    total_grupos = groups.Count(),
                    investigadores_activos = stats.TotalInvestigadoresActivos,
                    convocatorias = stats.TotalConvocatoriasAbiertas,
                    estados_distribucion = estadosDistribucion,
                    lineas_distribucion = lineasDistribucion,
                    indicadores_caces = indicadoresCaces,
                    proyectos_tabla = proyectosTabla,
                    grupos_consolidados = consolidatedGroups,
                    proyectos_con_estudiantes = withStudents
                };

                var request = new DocumentRequest
                {
                    TemplateCode = "REPORTE_ANALITICAS",
                    Data = reportData,
                    IsDraftMode = false,
                    IsBlindMode = false,
                    RequestedBy = User.Identity?.Name ?? "Sistema DIITRA"
                };

                var result = await _documentEngine.GenerateAsync(request);

                _logger.LogInformation("[DIITRA Reports] Reporte generado exitosamente. Hash={Hash}, Trazabilidad={Trace}",
                    result.FileHash, result.TraceabilityCode);

                var fileName = $"Reporte_Analiticas_ISTPET_{DateTime.Now:yyyyMMdd-HHmm}.pdf";
                return File(result.PdfBytes, "application/pdf", fileName);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "[DIITRA Reports] Error crítico al generar el reporte de analíticas");
                return BadRequest(new { error = "Error al generar el reporte: " + ex.Message });
            }
        }
    }
}