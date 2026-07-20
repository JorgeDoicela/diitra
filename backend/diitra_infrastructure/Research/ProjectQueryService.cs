using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research
{
    public class ProjectQueryService : IProjectQueryService
    {
        private static readonly string[] OversightRoleCodes = { "DIITRA_ADMIN" };
        private readonly DiitraContext _context;

        public ProjectQueryService(DiitraContext context)
        {
            _context = context;
        }

        public async Task<string?> ResolveCanonicalUuidAsync(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier)) return null;

            var trimmed = identifier.Trim();

            var exact = await _context.InvProyectos
                .Where(p => p.Uuid == trimmed)
                .Select(p => p.Uuid)
                .FirstOrDefaultAsync();
            if (exact != null) return exact;

            if (int.TryParse(trimmed, out int idProyecto))
            {
                var byId = await _context.InvProyectos
                    .Where(p => p.IdProyecto == idProyecto)
                    .Select(p => p.Uuid)
                    .FirstOrDefaultAsync();
                if (byId != null) return byId;
            }

            if (!trimmed.Contains('-') && trimmed.Length >= 4)
            {
                var prefix = trimmed.ToLowerInvariant();
                var matches = await _context.InvProyectos
                    .Where(p => p.Uuid.ToLower().StartsWith(prefix))
                    .Select(p => p.Uuid)
                    .ToListAsync();

                if (matches.Count == 1) return matches[0];
                if (matches.Count > 1)
                {
                    var segmentMatch = matches.FirstOrDefault(u =>
                        u.Split('-')[0].Equals(trimmed, StringComparison.OrdinalIgnoreCase));
                    return segmentMatch ?? matches[0];
                }
            }

            return null;
        }

        public async Task<List<ProyectoResumenDto>> GetAllProjectsAsync()
        {
            return await _context.InvProyectos
                .Include(p => p.IdSublineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.IdObjetivoPndNavigation)
                .Include(p => p.IdEntidadAliadaNavigation)
                .Include(p => p.InvProyectoParticipantes)
                .Include(p => p.InvProductos)
                .Include(p => p.InvInformesAvance)
                .Include(p => p.InvProyectosCarreras).ThenInclude(pc => pc.IdCarreraNavigation)
                .OrderByDescending(p => p.FechaRegistro)
                .Select(p => new ProyectoResumenDto
                {
                    IdProyecto = p.IdProyecto,
                    Uuid = p.Uuid,
                    CodigoInstitucional = p.CodigoInstitucional,
                    Titulo = p.Titulo,
                    Estado = p.Estado,
                    LineaInvestigacion = p.IdSublineaNavigation != null ? p.IdSublineaNavigation.Nombre : null,
                    Carrera = p.InvProyectosCarreras.Select(pc => pc.IdCarreraNavigation.Carrera1).FirstOrDefault(),
                    PresupuestoTotal = p.InvPresupuestoItems.Any()
                        ? p.InvPresupuestoItems.Sum(i => (decimal?)i.ValorUnitario * (decimal?)i.Cantidad)
                        : p.PresupuestoEstimado,
                    PresupuestoEjecutado = p.ValorEjecucion,
                    PuntajeEvaluacion = p.PuntajeEvaluacion,
                    FechaRegistro = p.FechaRegistro,
                    FechaModificacion = p.FechaModificacion,
                    FechaInicio = p.FechaInicio,
                    FechaFin = p.FechaFin,
                    TiempoEjecucion = p.TiempoEjecucion,
                    ConvocatoriaTitulo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.Titulo : null,
                    TotalInvestigadores = p.InvProyectoParticipantes.Count(pp => pp.Activo != false),
                    TotalProductos = p.InvProductos.Count,
                    TotalInformes = p.InvInformesAvance.Count,
                    InformesAprobados = p.InvInformesAvance.Count(i => i.Estado == "Aprobado"),
                    TrlActual = (int?)p.TrlActual,
                    TrlMeta = (int?)p.TrlMeta,
                    TotalEstudiantes = p.InvProyectoParticipantes.Count(pp => pp.TipoParticipante == "Alumno" && pp.Activo != false),
                    EntidadAliada = p.IdEntidadAliadaNavigation != null ? p.IdEntidadAliadaNavigation.RazonSocial : null,
                    ObjetivoPnd = p.IdObjetivoPndNavigation != null ? p.IdObjetivoPndNavigation.Nombre : null,
                    ConvocatoriaCodigo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.CodigoConvocatoria : null,
                    DirectorNombre = p.InvProyectoParticipantes
                        .Where(pp => pp.EsDirector == true && pp.IdUsuarioNavigation != null)
                        .Select(pp => pp.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
                        ?? p.InvProyectoParticipantes
                        .Where(pp => pp.IdUsuarioNavigation != null)
                        .Select(pp => pp.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
                })
                .ToListAsync();
        }

        public async Task<List<ProyectoResumenDto>> GetMyProjectsAsync(string userIdReferencia)
        {
            var userId = await _context.Users
                .Where(u => u.IdSigafi == userIdReferencia)
                .Select(u => (int?)u.IdUsuario)
                .FirstOrDefaultAsync();

            if (userId == null)
            {
                return new List<ProyectoResumenDto>();
            }

            var groupIds = await _context.InvGruposMiembros
                .Where(m => m.IdUsuario == userId.Value && m.Activo != false)
                .Select(m => m.IdGrupo)
                .Distinct()
                .ToListAsync();

            var projectIds = await _context.InvProyectoParticipantes
                .Where(pp => pp.IdUsuario == userId.Value && pp.Activo != false)
                .Select(pp => pp.IdProyecto)
                .Distinct()
                .ToListAsync();

            return await _context.InvProyectos
                .Include(p => p.IdSublineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.IdObjetivoPndNavigation)
                .Include(p => p.IdEntidadAliadaNavigation)
                .Include(p => p.InvProyectoParticipantes)
                .Include(p => p.InvProductos)
                .Include(p => p.InvInformesAvance)
                .Include(p => p.InvProyectosCarreras).ThenInclude(pc => pc.IdCarreraNavigation)
                .Where(p => projectIds.Contains(p.IdProyecto) || (p.TieneGrupo == true && p.IdGrupo.HasValue && groupIds.Contains(p.IdGrupo.Value)))
                .OrderByDescending(p => p.FechaRegistro)
                .Select(p => new ProyectoResumenDto
                {
                    IdProyecto = p.IdProyecto,
                    Uuid = p.Uuid,
                    CodigoInstitucional = p.CodigoInstitucional,
                    Titulo = p.Titulo,
                    Estado = p.Estado,
                    LineaInvestigacion = p.IdSublineaNavigation != null ? p.IdSublineaNavigation.Nombre : null,
                    Carrera = p.InvProyectosCarreras.Select(pc => pc.IdCarreraNavigation.Carrera1).FirstOrDefault(),
                    PresupuestoTotal = p.InvPresupuestoItems.Any()
                        ? p.InvPresupuestoItems.Sum(i => (decimal?)i.ValorUnitario * (decimal?)i.Cantidad)
                        : p.PresupuestoEstimado,
                    PresupuestoEjecutado = p.ValorEjecucion,
                    PuntajeEvaluacion = p.PuntajeEvaluacion,
                    FechaRegistro = p.FechaRegistro,
                    FechaModificacion = p.FechaModificacion,
                    FechaInicio = p.FechaInicio,
                    FechaFin = p.FechaFin,
                    TiempoEjecucion = p.TiempoEjecucion,
                    ConvocatoriaTitulo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.Titulo : null,
                    TotalInvestigadores = p.InvProyectoParticipantes.Count(pp => pp.Activo != false),
                    TotalProductos = p.InvProductos.Count,
                    TotalInformes = p.InvInformesAvance.Count,
                    InformesAprobados = p.InvInformesAvance.Count(i => i.Estado == "Aprobado"),
                    TrlActual = (int?)p.TrlActual,
                    TrlMeta = (int?)p.TrlMeta,
                    TotalEstudiantes = p.InvProyectoParticipantes.Count(pp => pp.TipoParticipante == "Alumno" && pp.Activo != false),
                    EntidadAliada = p.IdEntidadAliadaNavigation != null ? p.IdEntidadAliadaNavigation.RazonSocial : null,
                    ObjetivoPnd = p.IdObjetivoPndNavigation != null ? p.IdObjetivoPndNavigation.Nombre : null,
                    ConvocatoriaCodigo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.CodigoConvocatoria : null,
                    DirectorNombre = p.InvProyectoParticipantes
                        .Where(pp => pp.EsDirector == true && pp.IdUsuarioNavigation != null)
                        .Select(pp => pp.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
                        ?? p.InvProyectoParticipantes
                        .Where(pp => pp.IdUsuarioNavigation != null)
                        .Select(pp => pp.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
                })
                .ToListAsync();
        }

        public async Task<ProyectoDto?> GetProjectDetailAsync(string uuid)
        {
            var canonicalUuid = await ResolveCanonicalUuidAsync(uuid);
            if (canonicalUuid == null) return null;

            var basicProject = await _context.InvProyectos
                .Include(p => p.IdSublineaNavigation).ThenInclude(s => s!.IdLineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation).ThenInclude(c => c!.IdPeriodoNavigation)
                .Include(p => p.IdGrupoNavigation)
                .Include(p => p.IdProgramaNavigation)
                .Include(p => p.IdTipoNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);

            if (basicProject == null) return null;

            if (basicProject.Estado == "Prepropuesta" || basicProject.Estado == "Prepropuesta Rechazada")
            {
                string desc = "";
                if (!string.IsNullOrEmpty(basicProject.MetadataCacesJson))
                {
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(basicProject.MetadataCacesJson);
                        if (doc.RootElement.TryGetProperty("descripcionProyecto", out var el) || doc.RootElement.TryGetProperty("DescripcionProyecto", out el))
                        {
                            desc = el.GetString() ?? "";
                        }
                    }
                    catch {}
                }

                var lightDto = new ProyectoDto
                {
                    Uuid = basicProject.Uuid,
                    Estado = basicProject.Estado,
                    IdConvocatoria = basicProject.IdConvocatoria,
                    ConvocatoriaTitulo = basicProject.IdConvocatoriaNavigation?.Titulo,
                    Titulo = basicProject.Titulo,
                    DescripcionProyecto = desc,
                    TieneGrupoInvestigacion = basicProject.TieneGrupo,
                    PuntajeEvaluacion = basicProject.PuntajeEvaluacion,
                    LineaInvestigacion = basicProject.IdSublineaNavigation?.IdLineaNavigation?.NombreLinea,
                    SublineaInvestigacion = basicProject.IdSublineaNavigation?.Nombre,
                    Programa = basicProject.IdProgramaNavigation?.Nombre,
                    TipoInvestigacion = basicProject.IdTipoNavigation?.Nombre,
                    CostoTotal = basicProject.PresupuestoEstimado ?? 0,
                    Investigadores = new List<InvestigadorDto>()
                };

                var projectProfs = await _context.InvProyectoParticipantes
                    .Include(pp => pp.IdUsuarioNavigation)
                    .Where(pp => pp.IdProyecto == basicProject.IdProyecto && pp.TipoParticipante == "Docente")
                    .ToListAsync();

                foreach (var pp in projectProfs)
                {
                    lightDto.Investigadores.Add(new InvestigadorDto
                    {
                        Nombre = pp.IdUsuarioNavigation?.Nombre,
                        Cedula = pp.IdUsuarioNavigation?.IdSigafi,
                        Email = pp.IdUsuarioNavigation?.EmailInstitucional ?? pp.IdUsuarioNavigation?.IdSigafi ?? "",
                        Rol = pp.Rol,
                        Activo = pp.Activo ?? true,
                        EsDirector = pp.EsDirector ?? (pp.EsDirector == true)
                    });
                }

                var principalCarrera = await _context.InvProyectosCarreras
                    .Include(pc => pc.IdCarreraNavigation)
                    .Where(pc => pc.IdProyecto == basicProject.IdProyecto)
                    .OrderByDescending(pc => pc.Modalidad == "PRINCIPAL")
                    .Select(pc => pc.IdCarreraNavigation.Carrera1)
                    .FirstOrDefaultAsync();

                lightDto.Carrera = principalCarrera;
                return lightDto;
            }

            var p = await _context.InvProyectos
                .AsSplitQuery()
                .Include(p => p.IdSublineaNavigation).ThenInclude(s => s!.IdLineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation).ThenInclude(c => c!.IdPeriodoNavigation)
                .Include(p => p.IdGrupoNavigation)
                .Include(p => p.IdProgramaNavigation)
                .Include(p => p.IdTipoNavigation)
                .Include(p => p.InvProyectosCarreras)
                .Include(p => p.InvProyectoParticipantes).ThenInclude(pp => pp.IdUsuarioNavigation)
                .Include(p => p.InvObjetivosProyecto)
                .Include(p => p.InvPresupuestoItems)
                .Include(p => p.InvCronogramas)
                .Include(p => p.InvBibliografiasProyecto)
                .Include(p => p.InvImpactosProyecto)
                .Include(p => p.InvProductos).ThenInclude(pr => pr.IdTipoProductoNavigation)
                .Include(p => p.MatrizMarcoLogico)
                .Include(p => p.InvRecursosDisponibles)
                .Include(p => p.InvGastos).ThenInclude(g => g.IdItemNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);

            if (p == null) return null;

            ProyectoDto dto = new ProyectoDto();
            if (!string.IsNullOrEmpty(p.MetadataCacesJson))
            {
                try
                {
                    var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(p.MetadataCacesJson);
                    var deserialized = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (deserialized != null)
                    {
                        dto = deserialized;
                    }
                }
                catch
                {
                    dto = new ProyectoDto();
                }
            }
            else
            {
                dto = new ProyectoDto();
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(pr => pr.EsInstituto == 1)
                .OrderByDescending(pr => pr.Periodoactivoinstituto == 1)
                .ThenByDescending(pr => pr.Activo == true)
                .ThenByDescending(pr => pr.FechaInicial <= today && pr.FechaFinal >= today)
                .ThenByDescending(pr => pr.FechaInicial)
                .FirstOrDefaultAsync();
            var periodId = currentPeriod?.IdPeriodo;

            var researchSubcatId = await GetResearchSubcatIdAsync();

            var profCedulas = p.InvProyectoParticipantes
                .Where(pp => pp.TipoParticipante == "Docente" && pp.IdUsuarioNavigation != null)
                .Select(pp => pp.IdUsuarioNavigation!.IdSigafi.Trim())
                .Where(c => !string.IsNullOrEmpty(c))
                .ToList();

            var studentCedulas = p.InvProyectoParticipantes
                .Where(pp => pp.TipoParticipante == "Alumno" && pp.IdUsuarioNavigation != null)
                .Select(pp => pp.IdUsuarioNavigation!.IdSigafi.Trim())
                .Where(c => !string.IsNullOrEmpty(c))
                .ToList();

            var profCareers = new List<ProfesoresCarrerasPeriodo>();
            if (profCedulas.Any() && !string.IsNullOrEmpty(periodId))
            {
                var profCedulaLts = profCedulas.Select(c => c.Trim()).ToList();
                var rawCareers = await _context.ProfesoresCarrerasPeriodos
                    .Include(pc => pc.IdCarreraNavigation)
                    .Where(pc => pc.IdPeriodo == periodId && pc.EsActivo == 1 && pc.IdProfesor != null && profCedulaLts.Contains(pc.IdProfesor))
                    .ToListAsync();

                profCareers = rawCareers
                    .Where(pc => profCedulas.Any(ced => pc.IdProfesor!.Trim().Equals(ced, StringComparison.OrdinalIgnoreCase)))
                    .ToList();
            }

            var alumCareers = new List<AlumnosCarrera>();
            var students = new List<Alumno>();
            var currentMatriculas = new List<Matricula>();
            var relevantCursos = new List<Curso>();

            if (studentCedulas.Any())
            {
                var studentCedulaLts = studentCedulas.Select(c => c.Trim()).ToList();
                var rawAlumCareers = await _context.AlumnosCarreras
                    .Where(ac => ac.IdAlumno != null && studentCedulaLts.Contains(ac.IdAlumno))
                    .ToListAsync();
                alumCareers = rawAlumCareers
                    .Where(ac => studentCedulas.Any(ced => ac.IdAlumno!.Trim().Equals(ced, StringComparison.OrdinalIgnoreCase)))
                    .ToList();

                students = await _context.Alumnos
                    .Where(s => studentCedulas.Contains(s.IdAlumno.Trim()))
                    .ToListAsync();

                if (!string.IsNullOrEmpty(periodId))
                {
                    currentMatriculas = await _context.Matriculas
                        .Where(m => studentCedulas.Contains(m.IdAlumno.Trim()) && m.IdPeriodo == periodId)
                        .ToListAsync();
                }

                var levelIds = currentMatriculas.Select(m => (int?)m.IdNivel)
                    .Concat(students.Select(s => s.IdNivel))
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                relevantCursos = await _context.Cursos.Where(c => levelIds.Contains(c.IdNivel)).ToListAsync();
            }

            var allCarrerasList = await _context.Carreras.ToListAsync();

            var researchHours = new List<ProfesoresActividade>();
            var otherAssignedHours = new List<InvProyectoParticipante>();
            if (profCedulas.Any() && !string.IsNullOrEmpty(periodId))
            {
                researchHours = await _context.ProfesoresActividades
                    .Where(pa => profCedulas.Contains(pa.IdProfesor) && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == periodId)
                    .ToListAsync();

                var profUserIds = p.InvProyectoParticipantes.Where(pp => pp.TipoParticipante == "Docente").Select(pp => pp.IdUsuario).Distinct().ToList();
                var estadosConCarga = await GetEstadosConCargaHorariaAsync();
                otherAssignedHours = await _context.InvProyectoParticipantes
                    .Include(pp => pp.IdProyectoNavigation)
                    .Where(pp => pp.TipoParticipante == "Docente" &&
                                 profUserIds.Contains(pp.IdUsuario) &&
                                 pp.IdProyecto != p.IdProyecto &&
                                 pp.Activo != false &&
                                 estadosConCarga.Contains(pp.IdProyectoNavigation!.Estado))
                    .ToListAsync();
            }

            var investigadoresList = new List<InvestigadorDto>();

            foreach (var pp in p.InvProyectoParticipantes.Where(pp => pp.TipoParticipante == "Docente"))
            {
                var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, pp.IdUsuarioNavigation?.IdSigafi, pp.IdUsuarioNavigation?.TablaSigafi);
                if (string.IsNullOrEmpty(phone)) phone = pp.Telefono ?? string.Empty;

                var email = await ProjectHelper.GetUserEmailFromCatalogAsync(_context, pp.IdUsuarioNavigation?.IdSigafi, pp.IdUsuarioNavigation?.TablaSigafi);
                if (string.IsNullOrEmpty(email)) email = pp.IdUsuarioNavigation?.EmailInstitucional ?? pp.IdUsuarioNavigation?.IdSigafi ?? "";

                var cedula = pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                var linkedCareers = profCareers
                    .Where(pc => pc.IdProfesor.Trim() == cedula && pc.IdCarreraNavigation != null)
                    .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                    .Distinct()
                    .ToList();
                var carrerasDisponibles = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";
                var carreraNom = linkedCareers.FirstOrDefault() ?? "Docente";

                var existingInvInJson = dto?.Investigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == cedula);
                if (existingInvInJson != null && !string.IsNullOrWhiteSpace(existingInvInJson.Carrera))
                {
                    var savedCarrera = existingInvInJson.Carrera.Trim();
                    if (linkedCareers.Any(lc => lc != null && lc.Trim().Equals(savedCarrera, StringComparison.OrdinalIgnoreCase)))
                    {
                        carreraNom = savedCarrera;
                    }
                }

                var availableHours = researchHours.Where(pa => pa.IdProfesor.Trim() == cedula).Sum(pa => pa.HorasSemana ?? 0);
                var assignedHours = otherAssignedHours.Where(o => o.IdUsuario == pp.IdUsuario).Sum(o => o.HorasSemanales ?? 0);

                investigadoresList.Add(new InvestigadorDto
                {
                    Nombre = pp.IdUsuarioNavigation?.Nombre,
                    Cedula = pp.IdUsuarioNavigation?.IdSigafi,
                    Email = email,
                    Rol = pp.Rol,
                    NivelAcademico = pp.NivelAcademico,
                    Telefono = phone,
                    Activo = pp.Activo ?? true,
                    FechaInicio = pp.FechaInicio,
                    FechaFin = pp.FechaFin,
                    MotivoCambio = pp.MotivoCambio,
                    Carrera = carreraNom,
                    CarrerasDisponibles = carrerasDisponibles,
                    HorasSemanales = pp.HorasSemanales,
                    HorasDisponibles = availableHours,
                    HorasAsignadas = assignedHours,
                    EsDirector = pp.EsDirector
                });
            }

            foreach (var pa in p.InvProyectoParticipantes.Where(pp => pp.TipoParticipante == "Alumno"))
            {
                var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, pa.IdUsuarioNavigation?.IdSigafi, pa.IdUsuarioNavigation?.TablaSigafi);
                if (string.IsNullOrEmpty(phone)) phone = pa.Telefono ?? string.Empty;

                var email = await ProjectHelper.GetUserEmailFromCatalogAsync(_context, pa.IdUsuarioNavigation?.IdSigafi, pa.IdUsuarioNavigation?.TablaSigafi);
                if (string.IsNullOrEmpty(email)) email = pa.IdUsuarioNavigation?.EmailInstitucional ?? pa.IdUsuarioNavigation?.IdSigafi ?? "";

                var cedula = pa.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                var sCareerIds = alumCareers
                    .Where(ac => ac.IdAlumno != null && ac.IdAlumno.Trim().Equals(cedula, StringComparison.OrdinalIgnoreCase))
                    .Select(ac => ac.IdCarrera)
                    .ToList();
                var sCareers = allCarrerasList
                    .Where(c => sCareerIds.Contains(c.IdCarrera) && !string.IsNullOrEmpty(c.Carrera1))
                    .Select(c => c.Carrera1!)
                    .ToList();

                var studentObj = students.FirstOrDefault(s => s.IdAlumno != null && s.IdAlumno.Trim().Equals(cedula, StringComparison.OrdinalIgnoreCase));
                var matricula = currentMatriculas.FirstOrDefault(m => m.IdAlumno != null && m.IdAlumno.Trim().Equals(cedula, StringComparison.OrdinalIgnoreCase));

                var idNivelTarget = matricula?.IdNivel ?? studentObj?.IdNivel;
                if (idNivelTarget.HasValue)
                {
                    var cursoInfo = relevantCursos.FirstOrDefault(c => c.IdNivel == idNivelTarget.Value);
                    if (cursoInfo != null)
                    {
                        var resolvedCareer = allCarrerasList.FirstOrDefault(c => c.IdCarrera == cursoInfo.IdCarrera)?.Carrera1;
                        if (!string.IsNullOrEmpty(resolvedCareer) && !sCareers.Any(sc => sc.Equals(resolvedCareer, StringComparison.OrdinalIgnoreCase)))
                        {
                            sCareers.Add(resolvedCareer);
                        }
                    }
                }

                var carrerasDisponibles = sCareers.Any() ? string.Join(", ", sCareers) : "Estudiante";
                var carreraNom = sCareers.FirstOrDefault() ?? "Estudiante";

                var existingInvInJson = dto?.Investigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim().Equals(cedula, StringComparison.OrdinalIgnoreCase));
                if (existingInvInJson != null && !string.IsNullOrWhiteSpace(existingInvInJson.Carrera))
                {
                    var savedCarrera = existingInvInJson.Carrera.Trim();
                    if (sCareers.Any(sc => sc != null && sc.Trim().Equals(savedCarrera, StringComparison.OrdinalIgnoreCase)))
                    {
                        carreraNom = savedCarrera;
                    }
                }

                investigadoresList.Add(new InvestigadorDto
                {
                    Nombre = pa.IdUsuarioNavigation?.Nombre,
                    Cedula = pa.IdUsuarioNavigation?.IdSigafi,
                    Email = email,
                    Rol = pa.Rol,
                    NivelAcademico = pa.NivelAcademico,
                    Telefono = phone,
                    Activo = pa.Activo ?? true,
                    FechaInicio = pa.FechaInicio,
                    FechaFin = pa.FechaFin,
                    MotivoCambio = pa.MotivoCambio,
                    Carrera = carreraNom,
                    CarrerasDisponibles = carrerasDisponibles,
                });
            }

            dto ??= new ProyectoDto();
            dto.Uuid = p.Uuid;
            dto.CodigoInstitucional = p.CodigoInstitucional;
            dto.Estado = p.Estado;
            dto.IdConvocatoria = p.IdConvocatoria;
            dto.ConvocatoriaTitulo = p.IdConvocatoriaNavigation?.Titulo;
            dto.ConvocatoriaMontoMaximo = null;
            dto.IdCarrera = p.InvProyectosCarreras?.FirstOrDefault(pc => pc.Modalidad == "PRINCIPAL")?.IdCarrera ?? p.InvProyectosCarreras?.FirstOrDefault()?.IdCarrera;
            if (dto.IdCarrera.HasValue)
            {
                var carreraObj = allCarrerasList.FirstOrDefault(c => c.IdCarrera == dto.IdCarrera.Value);
                if (carreraObj != null)
                {
                    dto.Carrera = carreraObj.Carrera1;
                }
            }
            dto.IdObjetivoPnd = p.IdObjetivoPnd;
            dto.Titulo = p.Titulo;
            dto.TiempoEjecucion = p.TiempoEjecucion;
            dto.TieneGrupoInvestigacion = p.TieneGrupo;
            dto.TrlInicial = (int?)p.TrlInicial;
            dto.TrlActual = (int?)p.TrlActual;
            dto.TrlMeta = (int?)p.TrlMeta;
            dto.PuntajeEvaluacion = p.PuntajeEvaluacion;

            dto.LineaInvestigacion = p.IdSublineaNavigation?.IdLineaNavigation != null
                                     ? p.IdSublineaNavigation.IdLineaNavigation.NombreLinea
                                     : dto.LineaInvestigacion;
            dto.SublineaInvestigacion = p.IdSublineaNavigation != null
                                         ? p.IdSublineaNavigation.Nombre
                                         : dto.SublineaInvestigacion;

            dto.Programa = p.IdProgramaNavigation?.Nombre ?? dto.Programa;
            dto.TipoInvestigacion = p.IdTipoNavigation?.Nombre ?? dto.TipoInvestigacion;

            dto.DirectorProyecto = p.InvProyectoParticipantes
                .Where(pp => pp.EsDirector == true && pp.IdUsuarioNavigation != null && pp.TipoParticipante == "Docente")
                .Select(pp => pp.IdUsuarioNavigation.Nombre)
                .FirstOrDefault()
                ?? p.InvProyectoParticipantes
                .Where(pp => pp.IdUsuarioNavigation != null && pp.TipoParticipante == "Docente")
                .Select(pp => pp.IdUsuarioNavigation.Nombre)
                .FirstOrDefault()
                ?? dto.DirectorProyecto;
            if (p.IdGrupoNavigation != null)
            {
                dto.GrupoInvestigacion = p.IdGrupoNavigation.Nombre;
                dto.GrupoInvestigacionUuid = p.IdGrupoNavigation.Uuid;
                dto.TieneGrupoInvestigacion = true;
                dto.GrupoInvestigacionTipo = "SI";
                dto.GrupoInvestigacionNombre = p.IdGrupoNavigation.Nombre;

                if (p.IdGrupoNavigation.IdDominio.HasValue)
                {
                    var dom = await _context.InvDominios.FirstOrDefaultAsync(d => d.IdDominio == p.IdGrupoNavigation.IdDominio.Value);
                    if (dom != null)
                    {
                        dto.Dominio = dom.Nombre;
                    }
                }
            }
            else
            {
                dto.TieneGrupoInvestigacion = dto.TieneGrupoInvestigacion ?? false;
                dto.GrupoInvestigacionTipo = dto.GrupoInvestigacionTipo ?? "NO";
            }
            dto.CostoTotal = p.InvPresupuestoItems.Any()
                ? p.InvPresupuestoItems.Sum(i => i.ValorUnitario * i.Cantidad)
                : p.PresupuestoEstimado ?? 0;
            dto.Investigadores = investigadoresList;

            dto.FechaPresentacion = p.FechaPresentacion?.ToString("dd/MM/yyyy");
            dto.FechaInicio = p.FechaInicio?.ToString("dd/MM/yyyy");
            dto.FechaFin = p.FechaFin?.ToString("dd/MM/yyyy");
            dto.FechaInicioEstimada = p.FechaInicio?.ToString("dd/MM/yyyy");
            dto.FechaFinEstimada = p.FechaFin?.ToString("dd/MM/yyyy");
            dto.Periodo = p.IdConvocatoriaNavigation?.IdPeriodoNavigation?.Detalle
                          ?? p.IdConvocatoriaNavigation?.IdPeriodo
                          ?? dto.Periodo
                          ?? currentPeriod?.Detalle;
            dto.PeriodoConvocatoria = p.IdConvocatoriaNavigation?.IdPeriodoNavigation?.Detalle
                                      ?? p.IdConvocatoriaNavigation?.IdPeriodo
                                      ?? dto.PeriodoConvocatoria
                                      ?? dto.Periodo;
            dto.ObjetivosEspecificos = p.InvObjetivosProyecto
                .Where(o => !o.EsGeneral)
                .OrderBy(o => o.Orden)
                .Select(o => o.Descripcion)
                .ToList();
            dto.RecursosNecesarios = p.InvPresupuestoItems.Select(i => new RecursoNecesarioDto
            {
                Descripcion = i.Detalle,
                Cantidad = i.Cantidad.ToString(),
                CostoUnitario = i.ValorUnitario,
                IdPartida = i.IdPartida,
                EsGastoCapital = i.EsGastoCapital
            }).ToList();
            dto.RecursosDisponibles = p.InvRecursosDisponibles.Select(r => new RecursoDisponibleDto
            {
                Descripcion = r.Detalle,
                Cantidad = r.Cantidad.ToString(),
                Fuente = r.Fuente
            }).ToList();
            dto.ProductosEsperados = p.InvProductos.Select(pr => new ProductoEsperadoDto
            {
                Tipo = pr.IdTipoProductoNavigation != null ? pr.IdTipoProductoNavigation.Nombre : pr.Titulo,
                Cantidad = pr.Cantidad.ToString()
            }).ToList();
            dto.Impacto = new ImpactoProyectoDto
            {
                Social = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 1)?.Descripcion,
                Cientifico = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 2)?.Descripcion,
                Economico = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 3)?.Descripcion,
                Politico = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 4)?.Descripcion,
                Ambiental = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 5)?.Descripcion,
                Otro = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 6)?.Descripcion
            };
            var specificObjetivoIds = p.InvObjetivosProyecto
                .Where(o => !o.EsGeneral)
                .OrderBy(o => o.Orden)
                .Select(o => o.IdObjetivo)
                .ToList();

            dto.Cronograma = p.InvCronogramas.OrderBy(c => c.NumeroActividad).ToList().Select(c => new ActividadCronogramaDto
            {
                IdObjetivo = c.IdObjetivo == 0 ? 0 : (specificObjetivoIds.Contains(c.IdObjetivo) ? specificObjetivoIds.IndexOf(c.IdObjetivo) + 1 : 0),
                Numero = c.NumeroActividad,
                Actividad = c.Descripcion,
                RecursosNecesarios = c.RecursosNecesarios,
                Responsable = c.Responsable,
                Entregable = c.Entregable,
                Ponderacion = c.Ponderacion,
                EsEntregableCaces = c.EsEntregableCaces,
                FechaInicioPrevista = c.FechaInicioPrevista?.ToString("yyyy-MM-dd"),
                FechaFinPrevista = c.FechaFinPrevista?.ToString("yyyy-MM-dd"),
                Semanas = ProjectHelper.GetSemanasCalculadas(p.FechaInicio, p.FechaFin, c.FechaInicioPrevista, c.FechaFinPrevista)
            }).ToList();
            dto.Bibliografia = p.InvBibliografiasProyecto.Select(b => b.CitaApa).ToList();
            dto.MatrizMarcoLogico = p.MatrizMarcoLogico.Select(m => new MmlRowDto
            {
                Nivel = m.Nivel,
                Resumen = m.ResumenNarrativo,
                Indicadores = m.Indicadores,
                Medios = m.MediosVerificacion,
                Supuestos = m.Supuestos
            }).ToList();

            dto.Gastos = p.InvGastos.Select(g => new GastoDto
            {
                Id = g.Uuid.ToString(),
                Descripcion = g.Descripcion,
                Partida = g.IdItemNavigation?.IdPartida,
                Monto = g.Monto,
                Fecha = g.FechaGasto.ToString("yyyy-MM-dd"),
                ReferenciaFactura = g.NumeroFactura,
                Categoria = g.IdItemNavigation?.Categoria
            }).ToList();

            return dto;
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

        public async Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20)
        {
            var project = await _context.InvProyectos
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null) return new List<ProyectoActividadDto>();

            var instanceUuids = await _context.DocumentInstances
                .AsNoTracking()
                .Where(di => di.EntityUuid == projectUuid)
                .Select(di => di.Uuid)
                .ToListAsync();

            if (!instanceUuids.Contains(projectUuid))
            {
                instanceUuids.Add(projectUuid);
            }

            var actividades = new List<ProyectoActividadDto>();

            if (instanceUuids.Count > 0)
            {
                var sesiones = new List<diitra_infrastructure.data.models.Cowork.InvCoworkSesion>();
                foreach (var uuid in instanceUuids)
                {
                    var pattern = uuid + "%";
                    var list = await _context.InvCoworkSesiones.AsNoTracking()
                        .Where(s => EF.Functions.Like(s.DocumentoUuid, pattern) &&
                                    (s.SeccionNombre != null || s.Accion != null))
                        .OrderByDescending(s => s.ConectadoEn)
                        .Take(30)
                        .ToListAsync();
                    sesiones.AddRange(list);
                }

                sesiones = sesiones
                    .Where(s => !s.DesconectadoEn.HasValue ||
                                (s.DesconectadoEn.Value - s.ConectadoEn).TotalSeconds >= 5)
                    .OrderByDescending(s => s.ConectadoEn)
                    .Take(10)
                    .ToList();

                foreach (var s in sesiones)
                {
                    if (string.IsNullOrWhiteSpace(s.SeccionNombre) && string.IsNullOrWhiteSpace(s.Accion))
                    {
                        continue;
                    }

                    string seccion;
                    string descripcion;

                    if (!string.IsNullOrWhiteSpace(s.SeccionNombre))
                    {
                        seccion = s.SeccionNombre.Replace("_", " ");
                        descripcion = !string.IsNullOrWhiteSpace(s.Accion)
                            ? $"{s.Accion} '{seccion}'"
                            : "ha entrado a redactar";
                    }
                    else
                    {
                        var parts = s.DocumentoUuid.Split('_');
                        seccion = parts.Length > 1 ? parts[1].Replace("_", " ") : "el documento";
                        var durMin = s.DesconectadoEn.HasValue
                            ? (int)(s.DesconectadoEn.Value - s.ConectadoEn).TotalMinutes
                            : -1;

                        descripcion = durMin >= 0
                            ? $"Editó '{seccion}' durante {durMin} min"
                            : $"Está editando '{seccion}'";
                    }

                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "acceso",
                        NombreUsuario = string.IsNullOrWhiteSpace(s.NombreUsuario) ? "Usuario" : s.NombreUsuario,
                        RolUsuario = s.RolUsuario,
                        Descripcion = descripcion,
                        Fecha = s.ConectadoEn,
                        Icono = "edit"
                    });
                }

                var secciones = await _context.InvDocumentosSeccionesMetadata
                    .AsNoTracking()
                    .Where(m => instanceUuids.Contains(m.DocumentoUuid))
                    .OrderByDescending(m => m.ActualizadoEn)
                    .Take(10)
                    .ToListAsync();

                foreach (var sec in secciones)
                {
                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "seccion",
                        NombreUsuario = sec.UltimoNombreUsuario ?? "Sistema",
                        RolUsuario = "",
                        Descripcion = $"Sección '{sec.SeccionNombre}' marcada como {sec.Estado}",
                        Fecha = sec.ActualizadoEn,
                        Icono = sec.Estado == "Aprobado" ? "check" : sec.Estado == "En Revisión" ? "eye" : "edit"
                    });
                }

                var comentarios = await _context.InvCollaborationComments
                    .AsNoTracking()
                    .Where(c => instanceUuids.Contains(c.DocumentoUuid))
                    .OrderByDescending(c => c.CreadoEn)
                    .Take(10)
                    .ToListAsync();

                foreach (var c in comentarios)
                {
                    string textDesc = c.Contenido;
                    if (textDesc.Trim().StartsWith("{"))
                    {
                        try
                        {
                            using var doc = System.Text.Json.JsonDocument.Parse(textDesc);
                            var root = doc.RootElement;
                            if (root.TryGetProperty("text", out var textProp))
                            {
                                var textVal = textProp.GetString();
                                if (root.TryGetProperty("fieldName", out var fieldProp))
                                {
                                    var fieldVal = fieldProp.GetString();
                                    textDesc = $"Observó '{fieldVal}': {textVal}";
                                }
                                else
                                {
                                    textDesc = textVal ?? c.Contenido;
                                }
                            }
                        }
                        catch {}
                    }

                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "comentario",
                        NombreUsuario = string.IsNullOrWhiteSpace(c.NombreUsuario) ? "Usuario" : c.NombreUsuario,
                        RolUsuario = "",
                        Descripcion = textDesc,
                        Fecha = c.CreadoEn,
                        Icono = "comment"
                    });
                }
            }

            var trazas = await _context.InvTrazabilidadProyectos
                .AsNoTracking()
                .Where(t => t.IdProyecto == project.IdProyecto)
                .OrderByDescending(t => t.FechaTransicion)
                .Take(5)
                .ToListAsync();

            foreach (var t in trazas)
            {
                actividades.Add(new ProyectoActividadDto
                {
                    Tipo = "workflow",
                    NombreUsuario = "Sistema DIITRA",
                    RolUsuario = "",
                    Descripcion = $"Estado: {t.EstadoAnterior} → {t.EstadoNuevo}",
                    Fecha = t.FechaTransicion ?? DateTime.Now,
                    Icono = "workflow"
                });
            }

            return actividades
                .OrderByDescending(a => a.Fecha)
                .Take(maxItems)
                .ToList();
        }

        private async Task<List<string>> GetEstadosConCargaHorariaAsync()
        {
            var list = await _context.InvConfigWorkflows
                .Where(w => w.Activo && w.ContabilizaCargaHoraria)
                .Select(w => w.EstadoDestino)
                .Distinct()
                .ToListAsync();
            if (list == null || !list.Any())
            {
                list = new List<string> { "Enviado", "En Revisión", "Aprobado", "En Ejecución" };
            }
            return list;
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
