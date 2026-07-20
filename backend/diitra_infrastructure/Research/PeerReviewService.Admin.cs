using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using diitra_application.Research;
using Diitra.Application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.Research
{
    public partial class PeerReviewService : IPeerReviewService
    {
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
                var criteriosProyecto = await ObtenerCriteriosRubricaAsync(proyecto.IdConvocatoria);
                decimal? promedio = completadas.Any()
                    ? CalcularPromedioPonderado(completadas, criteriosProyecto)
                    : null;

                decimal umbralProyecto = 70m;
                string estadoArbitraje = DeterminarEstadoArbitraje(revisiones, umbralProyecto);
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

                    revDtos.Add(MapToDto(rev, nombre, meta, careerNom));
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
            var criteriosProyecto = await ObtenerCriteriosRubricaAsync(proyecto.IdConvocatoria);
            decimal? promedio = completadas.Any()
                ? CalcularPromedioPonderado(completadas, criteriosProyecto)
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

                revDtos.Add(MapToDto(rev, nombre, meta, careerNom));
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
                    : DeterminarEstadoArbitraje(revisiones, 70m),
                ArbitrajeCerrado = proyecto.PuntajeEvaluacion.HasValue
                    || proyecto.Estado is "Aprobado" or "En Ejecución" or "Rechazado",
                AutoExtendDeadlines = proyecto.AutoExtendDeadlines,
                AutoExtendDays = proyecto.AutoExtendDays,
                Revisiones = revDtos
            };
        }

        public async Task<IEnumerable<RevisorDisponibleDto>> SearchRevisoresAsync(
            string query, bool soloExternos, string? projectUuid)
        {
            var autoresSigafi = new HashSet<string>();
            if (!string.IsNullOrEmpty(projectUuid))
            {
                var proyecto = await _context.InvProyectos
                    .AsSplitQuery()
                    .Include(p => p.InvProyectoParticipantes)
                    .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

                if (proyecto != null)
                {
                    var userIds = proyecto.InvProyectoParticipantes.Select(p => p.IdUsuario)
                        .Distinct()
                        .ToList();

                    var sigafiIds = await _context.Users
                        .Where(u => userIds.Contains(u.IdUsuario))
                        .Select(u => u.IdSigafi)
                        .ToListAsync();

                    foreach (var id in sigafiIds)
                    {
                        if (id != null)
                            autoresSigafi.Add(id.Trim().ToLower());
                    }
                }
            }

            var queryNorm = query.Trim().ToLower();
            var result = new List<RevisorDisponibleDto>();

            if (soloExternos || !soloExternos)
            {
                var usuariosQuery = _context.Users
                    .Where(u => u.TablaSigafi == "otros" && _context.UserRoles.Any(ur => ur.IdUsuario == u.IdUsuario && ur.Role.CodigoRol == "DIITRA_REVISOR_EXTERNO"));

                if (!string.IsNullOrEmpty(queryNorm))
                {
                    var terms = queryNorm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var term in terms)
                    {
                        usuariosQuery = usuariosQuery.Where(u =>
                            (u.IdSigafi != null && u.IdSigafi.Contains(term)) ||
                            (u.Nombre != null && u.Nombre.ToLower().Contains(term)) ||
                            (u.EmailInstitucional != null && u.EmailInstitucional.ToLower().Contains(term))
                        );
                    }
                }

                var usuarios = await usuariosQuery
                    .OrderBy(u => u.Nombre)
                    .Take(30)
                    .ToListAsync();

                usuarios = usuarios.Where(u => u.IdSigafi == null || !autoresSigafi.Contains(u.IdSigafi.Trim().ToLower())).ToList();

                foreach (var user in usuarios)
                {
                    var meta = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);
                    var revisionesActivas = await _context.Set<InvRevisionesPares>()
                        .CountAsync(r => r.IdRevisor == user.IdUsuario && r.Estado == "Pendiente");

                    string? institucion = null;
                    if (!string.IsNullOrEmpty(meta?.Configuracion))
                    {
                        try
                        {
                            using var doc = System.Text.Json.JsonDocument.Parse(meta.Configuracion);
                            if (doc.RootElement.TryGetProperty("institucion", out var prop))
                            {
                                institucion = prop.GetString();
                            }
                        }
                        catch {}
                    }

                    result.Add(new RevisorDisponibleDto
                    {
                        IdUsuario = user.IdUsuario,
                        NombreCompleto = !string.IsNullOrWhiteSpace(user.Nombre) ? user.Nombre : user.IdSigafi,
                        Email = user.IdSigafi.Contains("@") ? user.IdSigafi : (user.EmailInstitucional ?? "externo@diitra.ist"),
                        Especialidad = meta?.Especialidad,
                        GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                        OrcidId = meta?.OrcidId,
                        Institucion = institucion,
                        EsExterno = true,
                        RevisionesActivas = revisionesActivas
                    });
                }
            }

            if (!soloExternos)
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

                var researchSubcatId = await _context.SubcategoriasActividades
                    .Where(s => s.Subcategoria == "INVESTIGACION")
                    .Select(s => s.IdSubcategoria)
                    .FirstOrDefaultAsync();
                if (researchSubcatId == 0) researchSubcatId = 7;

                var queryDocentes = _context.Profesores.Where(p => p.Activo == 1);

                if (!string.IsNullOrEmpty(periodId))
                {
                    queryDocentes = queryDocentes.Where(p => _context.ProfesoresActividades.Any(pa =>
                        pa.IdProfesor == p.IdProfesor &&
                        pa.IdSubcategoria == researchSubcatId &&
                        pa.IdPeriodo == periodId));
                }

                if (!string.IsNullOrEmpty(queryNorm))
                {
                    var terms = queryNorm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var term in terms)
                    {
                        queryDocentes = queryDocentes.Where(p =>
                            (p.IdProfesor != null && p.IdProfesor.Contains(term)) ||
                            (p.PrimerNombre != null && p.PrimerNombre.ToLower().Contains(term)) ||
                            (p.SegundoNombre != null && p.SegundoNombre.ToLower().Contains(term)) ||
                            (p.PrimerApellido != null && p.PrimerApellido.ToLower().Contains(term)) ||
                            (p.SegundoApellido != null && p.SegundoApellido.ToLower().Contains(term)) ||
                            (p.EmailInstitucional != null && p.EmailInstitucional.ToLower().Contains(term)) ||
                            (p.Email != null && p.Email.ToLower().Contains(term))
                        );
                    }
                }

                var profesores = await queryDocentes
                    .OrderBy(p => p.PrimerApellido)
                    .ThenBy(p => p.PrimerNombre)
                    .Take(30)
                    .ToListAsync();

                profesores = profesores.Where(p => !autoresSigafi.Contains(p.IdProfesor.Trim().ToLower())).ToList();

                var docIds = profesores.Select(p => p.IdProfesor.Trim()).ToList();
                var profCareers = await _context.ProfesoresCarrerasPeriodos
                    .Include(pc => pc.IdCarreraNavigation)
                    .Where(pc => docIds.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == periodId && pc.EsActivo == 1)
                    .ToListAsync();

                foreach (var p in profesores)
                {
                    var pId = p.IdProfesor.Trim();
                    
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == pId);
                    if (user == null)
                    {
                        string fullNombre = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim();
                        user = new User {
                            IdSigafi = pId,
                            Nombre = fullNombre,
                            Contrasenia = BCrypt.Net.BCrypt.HashPassword(p.Clave ?? "cambiame", 11),
                            Activo = true,
                            TablaSigafi = "profesor",
                            EmailInstitucional = p.EmailInstitucional ?? p.Email
                        };
                        _context.Users.Add(user);
                        await _context.SaveChangesAsync();

                        var metadata = new InvUsuarioMetadata { IdUsuario = user.IdUsuario, Uuid = Guid.NewGuid(), Version = 1 };
                        _context.InvUsuariosMetadata.Add(metadata);
                        await _context.SaveChangesAsync();
                    }

                    var meta = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);
                    var revisionesActivas = await _context.Set<InvRevisionesPares>()
                        .CountAsync(r => r.IdRevisor == user.IdUsuario && r.Estado == "Pendiente");

                    var linkedCareers = profCareers
                        .Where(pc => pc.IdProfesor.Trim() == pId && pc.IdCarreraNavigation != null)
                        .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                        .Distinct()
                        .ToList();
                    var carreraNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";

                    result.Add(new RevisorDisponibleDto
                    {
                        IdUsuario = user.IdUsuario,
                        NombreCompleto = user.Nombre ?? pId,
                        Email = p.EmailInstitucional ?? p.Email ?? "",
                        Especialidad = meta?.Especialidad,
                        GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                        OrcidId = meta?.OrcidId,
                        EsExterno = false,
                        RevisionesActivas = revisionesActivas,
                        Carrera = carreraNom
                    });
                }
            }

            return result;
        }

        public async Task<string> RegisterRevisorExternoAsync(RegistrarRevisorExternoDto dto, int directorId)
        {
            string identifier = !string.IsNullOrEmpty(dto.Cedula) ? dto.Cedula : dto.Email;

            var existing = await _context.Users.FirstOrDefaultAsync(u => 
                u.IdSigafi == identifier || 
                u.IdSigafi == dto.Email || 
                u.EmailInstitucional == dto.Email);

            if (existing != null)
            {
                if (string.IsNullOrEmpty(existing.Nombre) || string.IsNullOrWhiteSpace(existing.Nombre))
                {
                    existing.Nombre = $"{dto.Nombres} {dto.Apellidos}".Trim();
                    await _context.SaveChangesAsync();
                }

                if (string.IsNullOrEmpty(existing.EmailInstitucional))
                {
                    existing.EmailInstitucional = dto.Email;
                    await _context.SaveChangesAsync();
                }

                var metaExisting = await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == existing.IdUsuario);
                if (metaExisting == null)
                {
                    metaExisting = new InvUsuarioMetadata
                    {
                        IdUsuario = existing.IdUsuario,
                        Uuid = Guid.NewGuid(),
                        Version = 1,
                        OrcidId = dto.OrcidId,
                        Especialidad = dto.Especialidad,
                        GradoAcademicoMaximo = dto.GradoAcademico
                    };
                    _context.Set<InvUsuarioMetadata>().Add(metaExisting);
                    await _context.SaveChangesAsync();
                }
                return metaExisting.Uuid.ToString();
            }

            var user = new User
            {
                IdSigafi = identifier,
                Nombre = $"{dto.Nombres} {dto.Apellidos}",
                Contrasenia = BCrypt.Net.BCrypt.HashPassword("Diitra2026*", 11),
                Activo = true,
                TablaSigafi = "otros",
                EmailInstitucional = dto.Email
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var configDict = new Dictionary<string, string> { { "institucion", dto.Institucion } };
            var metadata = new InvUsuarioMetadata
            {
                IdUsuario = user.IdUsuario,
                Uuid = Guid.NewGuid(),
                Version = 1,
                OrcidId = dto.OrcidId,
                Especialidad = dto.Especialidad,
                GradoAcademicoMaximo = dto.GradoAcademico,
                Configuracion = System.Text.Json.JsonSerializer.Serialize(configDict)
            };
            _context.Set<InvUsuarioMetadata>().Add(metadata);
            await _context.SaveChangesAsync();

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == "DIITRA_REVISOR_EXTERNO");
            if (role == null)
            {
                role = new Role { CodigoRol = "DIITRA_REVISOR_EXTERNO", Nombre = "Revisor Externo DIITRA", EsActivo = true };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }

            _context.UserRoles.Add(new UserRole
            {
                IdUsuario = user.IdUsuario,
                IdRol = role.IdRol,
                EsActivo = true,
                FechaCreacion = DateOnly.FromDateTime(DateTime.UtcNow)
            });
            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(directorId, "REGISTRAR_REVISOR_EXTERNO",
                $"Revisor externo registrado: {dto.Nombres} {dto.Apellidos} ({dto.Email})",
                "PEER_REVIEW", null, null);

            return metadata.Uuid.ToString();
        }

        public async Task<IEnumerable<RevisorDisponibleDto>> GetRevisoresExternosAsync()
        {
            var externos = await _context.Users
                .Where(u => u.TablaSigafi == "otros")
                .ToListAsync();

            var result = new List<RevisorDisponibleDto>();
            foreach (var user in externos)
            {
                var meta = await _context.Set<InvUsuarioMetadata>()
                    .FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);

                var revisionesActivas = await _context.Set<InvRevisionesPares>()
                    .CountAsync(r => r.IdRevisor == user.IdUsuario && r.Estado == "Pendiente");

                string? institucion = null;
                if (!string.IsNullOrEmpty(meta?.Configuracion))
                {
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(meta.Configuracion);
                        if (doc.RootElement.TryGetProperty("institucion", out var prop))
                        {
                            institucion = prop.GetString();
                        }
                    }
                    catch {}
                }

                result.Add(new RevisorDisponibleDto
                {
                    IdUsuario = user.IdUsuario,
                    NombreCompleto = user.Nombre ?? user.IdSigafi,
                    Email = user.EmailInstitucional ?? user.IdSigafi,
                    Especialidad = meta?.Especialidad,
                    GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                    OrcidId = meta?.OrcidId,
                    Institucion = institucion,
                    EsExterno = true,
                    RevisionesActivas = revisionesActivas
                });
            }
            return result;
        }
    }
}
