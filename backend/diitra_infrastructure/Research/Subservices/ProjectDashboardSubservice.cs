using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research.Subservices
{
    public class ProjectDashboardSubservice : IProjectDashboardSubservice
    {
        private readonly DiitraContext _context;

        public ProjectDashboardSubservice(DiitraContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync(string userIdReferencia, bool isAdmin)
        {
            var stats = new DashboardStatsDto();

            var proyectosQuery = _context.InvProyectos.AsQueryable();

            var conteoEstados = await proyectosQuery
                .GroupBy(p => p.Estado)
                .Select(g => new { Estado = g.Key ?? "Borrador", Cantidad = g.Count() })
                .ToListAsync();

            var conteoDict = conteoEstados.ToDictionary(x => x.Estado, x => x.Cantidad, StringComparer.OrdinalIgnoreCase);

            stats.TotalProyectos = conteoDict.Values.Sum();
            stats.ProyectosBorrador = conteoDict.GetValueOrDefault("Borrador", 0);
            stats.ProyectosEnRevision = conteoDict.GetValueOrDefault("En Revisión", 0) + conteoDict.GetValueOrDefault("Enviado", 0);
            stats.ProyectosAprobados = conteoDict.GetValueOrDefault("Aprobado", 0);
            stats.ProyectosEnEjecucion = conteoDict.GetValueOrDefault("En Ejecución", 0);
            stats.ProyectosFinalizados = conteoDict.GetValueOrDefault("Finalizado", 0);

            stats.TotalConvocatoriasAbiertas = await _context.InvConvocatorias
                .CountAsync(c => c.Estado == "Abierta");

            stats.TotalProductosPeriodo = await _context.InvProductos.CountAsync();
            stats.ArticulosIndexados = await _context.InvProductos
                .CountAsync(p => p.IdTipoProductoNavigation.Nombre.Contains("Artículo"));
            stats.Prototipos = await _context.InvProductos
                .CountAsync(p => p.IdTipoProductoNavigation.Nombre.Contains("Prototipo"));
            stats.Ponencias = await _context.InvProductos
                .CountAsync(p => p.IdTipoProductoNavigation.Nombre.Contains("Libro") || p.IdTipoProductoNavigation.Nombre.Contains("Ponencia"));

            stats.PresupuestoTotalAsignado = await _context.InvPresupuestoItems
                .SumAsync(i => (decimal?)(i.ValorUnitario * i.Cantidad)) ?? 0;
            stats.PresupuestoTotalEjecutado = await _context.InvProyectos
                .SumAsync(p => p.ValorEjecucion ?? 0);

            stats.TotalInvestigadoresActivos = await _context.InvProyectoParticipantes
                .Where(pp => pp.Activo != false && pp.IdProyectoNavigation!.Estado != "Borrador" && pp.IdProyectoNavigation.Estado != "Rechazado" && pp.IdProyectoNavigation.Estado != "Anulado")
                .Select(pp => pp.IdUsuario)
                .Distinct()
                .CountAsync();

            var colorMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Borrador", "#6B7280" },
                { "Enviado", "#3B82F6" },
                { "En Revisión", "#F59E0B" },
                { "Aprobado", "#10B981" },
                { "En Ejecución", "#8B5CF6" },
                { "Finalizado", "#059669" },
                { "Rechazado", "#EF4444" }
            };

            stats.ProyectosPorEstado = conteoEstados
                .Select(x => new EstadoConteoDto
                {
                    Estado = x.Estado,
                    Cantidad = x.Cantidad,
                    Color = colorMap.TryGetValue(x.Estado, out var col) ? col : "#6B7280"
                })
                .ToList();

            var userId = await _context.Users
                .Where(u => u.IdSigafi.Trim() == userIdReferencia.Trim())
                .Select(u => (int?)u.IdUsuario)
                .FirstOrDefaultAsync();

            if (userId != null)
            {
                var misIds = _context.InvProyectoParticipantes
                    .Where(pp => pp.IdUsuario == userId.Value).Select(pp => pp.IdProyecto);

                stats.MisProyectosActivos = await _context.InvProyectos
                    .Where(p => misIds.Contains(p.IdProyecto) && (p.Estado == "En Ejecución" || p.Estado == "Aprobado"))
                    .CountAsync();

                stats.MisProyectosBorrador = await _context.InvProyectos
                    .Where(p => misIds.Contains(p.IdProyecto) && p.Estado == "Borrador")
                    .CountAsync();

                stats.MisProyectosEnRevision = await _context.InvProyectos
                    .Where(p => misIds.Contains(p.IdProyecto) && (p.Estado == "En Revisión" || p.Estado == "Enviado"))
                    .CountAsync();

                stats.MisProductosRegistrados = await _context.InvProductos
                    .Where(p => misIds.Contains(p.IdProyecto))
                    .CountAsync();

                stats.MisInformesPendientes = await _context.InvInformesAvance
                    .Where(i => misIds.Contains(i.IdProyecto) && i.Estado == "Pendiente")
                    .CountAsync();

                stats.MisHorasInvestigacion = await _context.InvProyectoParticipantes
                    .Where(pp => pp.IdUsuario == userId.Value && pp.Activo != false && pp.TipoParticipante == "Docente" && (pp.IdProyectoNavigation!.Estado == "En Ejecución" || pp.IdProyectoNavigation.Estado == "Aprobado"))
                    .SumAsync(pp => (decimal?)pp.HorasSemanales ?? 0);

                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var currentPeriod = await _context.Periodos
                    .Where(pr => pr.EsInstituto == 1)
                    .OrderByDescending(pr => pr.Periodoactivoinstituto == 1)
                    .ThenByDescending(pr => pr.Activo == true)
                    .ThenByDescending(pr => pr.FechaInicial <= today && pr.FechaFinal >= today)
                    .ThenByDescending(pr => pr.FechaInicial)
                    .FirstOrDefaultAsync();

                if (currentPeriod != null)
                {
                    var researchSubcatId = await GetResearchSubcatIdAsync();

                    stats.HorasDisponiblesDistributivo = await _context.ProfesoresActividades
                        .Where(pa => pa.IdProfesor.Trim() == userIdReferencia.Trim() && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                        .SumAsync(pa => (decimal?)pa.HorasSemana ?? 0);
                }
                else
                {
                    stats.HorasDisponiblesDistributivo = 0;
                }
            }

            var ultimosProyectosQuery = _context.InvProyectos.AsQueryable();
            var ultimosInformesQuery = _context.InvInformesAvance.AsQueryable();

            if (!isAdmin && userId != null)
            {
                var misIds = _context.InvProyectoParticipantes
                    .Where(pp => pp.IdUsuario == userId.Value).Select(pp => pp.IdProyecto);

                ultimosProyectosQuery = ultimosProyectosQuery.Where(p => misIds.Contains(p.IdProyecto));
                ultimosInformesQuery = ultimosInformesQuery.Where(i => misIds.Contains(i.IdProyecto));
            }

            var ultimosProyectos = await ultimosProyectosQuery
                .OrderByDescending(p => p.FechaModificacion ?? p.FechaRegistro)
                .Take(5)
                .Select(p => new ActividadRecienteDto
                {
                    Tipo = "proyecto",
                    Descripcion = p.Titulo,
                    Fecha = p.FechaModificacion ?? p.FechaRegistro ?? DateTime.Now,
                    Uuid = p.Uuid,
                    Estado = p.Estado
                })
                .ToListAsync();

            var ultimosInformesDb = await ultimosInformesQuery
                .Include(i => i.IdProyectoNavigation)
                .OrderByDescending(i => i.IdInforme)
                .Take(5)
                .Select(i => new
                {
                    i.NumeroInforme,
                    TituloProyecto = i.IdProyectoNavigation.Titulo,
                    i.FechaFirma,
                    i.FechaReporte,
                    UuidString = i.Uuid.ToString(),
                    ProyectoUuid = i.IdProyectoNavigation.Uuid,
                    i.Estado
                })
                .ToListAsync();

            var ultimosInformes = ultimosInformesDb.Select(i => new ActividadRecienteDto
            {
                Tipo = "informe",
                Descripcion = $"Informe #{i.NumeroInforme} — {i.TituloProyecto}",
                Fecha = i.FechaFirma ?? new DateTime(i.FechaReporte.Year, i.FechaReporte.Month, i.FechaReporte.Day, 0, 0, 0, DateTimeKind.Utc),
                Uuid = i.ProyectoUuid,
                Estado = i.Estado
            }).ToList();

            stats.ActividadReciente = ultimosProyectos
                .Concat(ultimosInformes)
                .OrderByDescending(a => a.Fecha)
                .Take(8)
                .ToList();

            return stats;
        }

        private async Task<int> GetResearchSubcatIdAsync()
        {
            var researchSubcatId = await _context.SubcategoriasActividades
                .Where(s => s.Subcategoria == "INVESTIGACION")
                .Select(s => s.IdSubcategoria)
                .FirstOrDefaultAsync();
            if (researchSubcatId == 0) researchSubcatId = 7;
            return researchSubcatId;
        }
    }
}
