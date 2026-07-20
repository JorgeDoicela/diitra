using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research.Subservices
{
    public class PeerReviewQuerySubservice : IPeerReviewQuerySubservice
    {
        private readonly DiitraContext _context;

        public PeerReviewQuerySubservice(DiitraContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ArbitrajeProyectoDto>> GetArbitrajesActivosAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(p => p.EsInstituto == 1)
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();
            var periodId = currentPeriod?.IdPeriodo;

            var proyectosEnRevision = await _context.InvProyectos
                .Include(p => p.IdConvocatoriaNavigation)
                .Where(p => p.Estado == "En Revisión" || p.Estado == "Enviado" || 
                           ((p.Estado == "Aprobado" || p.Estado == "En Ejecución" || p.Estado == "Rechazado") && 
                            _context.Set<InvRevisionesPares>().Any(r => r.IdProyecto == p.IdProyecto)))
                .ToListAsync();

            var result = new List<ArbitrajeProyectoDto>();

            foreach (var proyecto in proyectosEnRevision)
            {
                var revisiones = await _context.Set<InvRevisionesPares>()
                    .Include(r => r.Detalles)
                    .Where(r => r.IdProyecto == proyecto.IdProyecto)
                    .ToListAsync();

                var completadas = revisiones.Where(r => r.Estado == "Completada").ToList();
                var criteriosProyecto = await PeerReviewHelper.ObtenerCriteriosRubricaAsync(_context, proyecto.IdConvocatoria);
                decimal? promedio = completadas.Any()
                    ? PeerReviewHelper.CalcularPromedioPonderado(completadas, criteriosProyecto)
                    : null;

                decimal umbralProyecto = 70m;
                string estadoArbitraje = PeerReviewHelper.DeterminarEstadoArbitraje(revisiones, umbralProyecto);
                if (proyecto.Estado is "Aprobado" or "En Ejecución" or "Rechazado")
                {
                    estadoArbitraje = "Completado";
                }

                var revDtos = new List<PeerReviewDto>();
                foreach (var rev in revisiones)
                {
                    var user = rev.IdRevisor.HasValue
                        ? await _context.Users.FindAsync(rev.IdRevisor.Value)
                        : null;
                    var meta = rev.IdRevisor.HasValue
                        ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == rev.IdRevisor.Value)
                        : null;
                    var nombre = user?.Nombre ?? "Revisor Externo";

                    string? careerNom = null;
                    if (user != null && user.TablaSigafi == "profesor" && !string.IsNullOrEmpty(user.IdSigafi) && !string.IsNullOrEmpty(periodId))
                    {
                        var teacherId = user.IdSigafi.Trim();
                        var linkedCareers = await _context.ProfesoresCarrerasPeriodos
                            .Include(pc => pc.IdCarreraNavigation)
                            .Where(pc => pc.IdProfesor.Trim() == teacherId && pc.IdPeriodo == periodId && pc.EsActivo == 1 && pc.IdCarreraNavigation != null)
                            .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                            .Distinct()
                            .ToListAsync();
                        careerNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";
                    }

                    revDtos.Add(PeerReviewHelper.MapToDto(rev, nombre, meta, careerNom));
                }

                result.Add(new ArbitrajeProyectoDto
                {
                    ProyectoUuid = proyecto.Uuid,
                    IdProyecto = proyecto.IdProyecto,
                    ProyectoTitulo = proyecto.Titulo,
                    CodigoInstitucional = proyecto.CodigoInstitucional,
                    EstadoProyecto = proyecto.Estado,
                    Convocatoria = proyecto.IdConvocatoriaNavigation?.Titulo,
                    TotalArbitros = revisiones.Count,
                    ArbitrosCompletados = completadas.Count,
                    PuntajePromedio = promedio,
                    EstadoArbitraje = estadoArbitraje,
                    ArbitrajeCerrado = proyecto.PuntajeEvaluacion.HasValue
                        || proyecto.Estado is "Aprobado" or "En Ejecución" or "Rechazado",
                    Revisiones = revDtos
                });
            }

            return result;
        }

        public async Task<ArbitrajeStatsDto> GetArbitrajeStatsAsync()
        {
            var todasRevisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Proyecto)
                    .ThenInclude(p => p.IdConvocatoriaNavigation)
                .Where(r => r.Proyecto.Estado == "En Revisión" || r.Proyecto.Estado == "Enviado" || 
                           r.Proyecto.Estado == "Aprobado" || r.Proyecto.Estado == "En Ejecución" || r.Proyecto.Estado == "Rechazado")
                .ToListAsync();

            int proyectos = todasRevisiones.Select(r => r.IdProyecto).Distinct().Count();
            int completadas = todasRevisiones.Count(r => r.Estado == "Completada");
            int pendientes = todasRevisiones.Count(r => r.Estado == "Pendiente");

            var proyectosConDesempate = todasRevisiones
                .Where(r => r.Proyecto.Estado != "Aprobado" && r.Proyecto.Estado != "En Ejecución" && r.Proyecto.Estado != "Rechazado")
                .GroupBy(r => r.IdProyecto)
                .Count(g =>
                {
                    var list = g.ToList();
                    if (list.All(r => r.Estado == "Completada"))
                    {
                        var scores = list.Where(r => r.PuntajeTotal.HasValue).Select(r => r.PuntajeTotal!.Value).ToList();
                        var threshold = 70m;
                        var aprobadosCount = scores.Count(s => s >= threshold);
                        var rechazadosCount = scores.Count(s => s < threshold);
                        return aprobadosCount == rechazadosCount && scores.Count > 0;
                    }
                    return false;
                });

            decimal porcentaje = todasRevisiones.Count > 0
                ? Math.Round((decimal)completadas / todasRevisiones.Count * 100, 1)
                : 0;

            return new ArbitrajeStatsDto
            {
                ProyectosEnRevision = proyectos,
                TotalArbitrosAsignados = todasRevisiones.Count,
                EvaluacionesCompletadas = completadas,
                EvaluacionesPendientes = pendientes,
                CasosDesempate = proyectosConDesempate,
                PorcentajeAvance = porcentaje
            };
        }

        public async Task<ArbitrajeProyectoDto?> GetArbitrajeByProjectAsync(string projectUuid)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(p => p.EsInstituto == 1)
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();
            var periodId = currentPeriod?.IdPeriodo;

            var proyecto = await _context.InvProyectos
                .Include(p => p.IdConvocatoriaNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (proyecto == null) return null;

            var revisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Detalles)
                .Where(r => r.IdProyecto == proyecto.IdProyecto)
                .ToListAsync();

            var completadas = revisiones.Where(r => r.Estado == "Completada").ToList();
            var criteriosProyecto = await PeerReviewHelper.ObtenerCriteriosRubricaAsync(_context, proyecto.IdConvocatoria);
            decimal? promedio = completadas.Any()
                ? PeerReviewHelper.CalcularPromedioPonderado(completadas, criteriosProyecto)
                : null;

            var revDtos = new List<PeerReviewDto>();
            foreach (var rev in revisiones)
            {
                var user = rev.IdRevisor.HasValue
                    ? await _context.Users.FindAsync(rev.IdRevisor.Value)
                    : null;
                var meta = rev.IdRevisor.HasValue
                    ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == rev.IdRevisor.Value)
                    : null;
                var nombre = user?.Nombre ?? "Revisor";

                string? careerNom = null;
                if (user != null && user.TablaSigafi == "profesor" && !string.IsNullOrEmpty(user.IdSigafi) && !string.IsNullOrEmpty(periodId))
                {
                    var teacherId = user.IdSigafi.Trim();
                    var linkedCareers = await _context.ProfesoresCarrerasPeriodos
                        .Include(pc => pc.IdCarreraNavigation)
                        .Where(pc => pc.IdProfesor.Trim() == teacherId && pc.IdPeriodo == periodId && pc.EsActivo == 1 && pc.IdCarreraNavigation != null)
                        .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                        .Distinct()
                        .ToListAsync();
                    careerNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";
                }

                revDtos.Add(PeerReviewHelper.MapToDto(rev, nombre, meta, careerNom));
            }

            return new ArbitrajeProyectoDto
            {
                ProyectoUuid = proyecto.Uuid,
                IdProyecto = proyecto.IdProyecto,
                ProyectoTitulo = proyecto.Titulo,
                CodigoInstitucional = proyecto.CodigoInstitucional,
                EstadoProyecto = proyecto.Estado,
                Convocatoria = proyecto.IdConvocatoriaNavigation?.Titulo,
                TotalArbitros = revisiones.Count,
                ArbitrosCompletados = completadas.Count,
                PuntajePromedio = promedio,
                EstadoArbitraje = (proyecto.Estado is "Aprobado" or "En Ejecución" or "Rechazado")
                    ? "Completado"
                    : PeerReviewHelper.DeterminarEstadoArbitraje(revisiones, 70m),
                ArbitrajeCerrado = proyecto.PuntajeEvaluacion.HasValue
                    || proyecto.Estado is "Aprobado" or "En Ejecución" or "Rechazado",
                AutoExtendDeadlines = proyecto.AutoExtendDeadlines,
                AutoExtendDays = proyecto.AutoExtendDays,
                Revisiones = revDtos
            };
        }

        public async Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(p => p.EsInstituto == 1)
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();
            var periodId = currentPeriod?.IdPeriodo;

            var revisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Proyecto)
                .Where(r => r.IdProyecto == projectId)
                .ToListAsync();

            var result = new List<PeerReviewDto>();
            foreach (var r in revisiones)
            {
                var user = r.IdRevisor.HasValue
                    ? await _context.Users.FindAsync(r.IdRevisor.Value)
                    : null;
                var nombre = user?.Nombre ?? "Revisor Externo";

                string? careerNom = null;
                if (user != null && user.TablaSigafi == "profesor" && !string.IsNullOrEmpty(user.IdSigafi) && !string.IsNullOrEmpty(periodId))
                {
                    var teacherId = user.IdSigafi.Trim();
                    var linkedCareers = await _context.ProfesoresCarrerasPeriodos
                        .Include(pc => pc.IdCarreraNavigation)
                        .Where(pc => pc.IdProfesor.Trim() == teacherId && pc.IdPeriodo == periodId && pc.EsActivo == 1 && pc.IdCarreraNavigation != null)
                        .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                        .Distinct()
                        .ToListAsync();
                    careerNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";
                }

                var meta = r.IdRevisor.HasValue
                    ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == r.IdRevisor.Value)
                    : null;

                result.Add(PeerReviewHelper.MapToDto(r, nombre, meta, careerNom));
            }
            return result;
        }
    }
}
