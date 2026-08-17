using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research.Subservices
{
    public class ProjectDetailSubservice : IProjectDetailSubservice
    {
        private readonly DiitraContext _context;
        private readonly IProjectLookupSubservice _lookupSubservice;

        public ProjectDetailSubservice(DiitraContext context, IProjectLookupSubservice lookupSubservice)
        {
            _context = context;
            _lookupSubservice = lookupSubservice;
        }

        public async Task<ProyectoDto?> GetProjectDetailAsync(string uuid)
        {
            var canonicalUuid = await _lookupSubservice.ResolveCanonicalUuidAsync(uuid);
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
                        if (doc.RootElement.TryGetProperty("descripcionProyecto", out var el) 
                         || doc.RootElement.TryGetProperty("DescripcionProyecto", out el)
                         || doc.RootElement.TryGetProperty("descripcionInnovacion", out el)
                         || doc.RootElement.TryGetProperty("DescripcionInnovacion", out el)
                         || doc.RootElement.TryGetProperty("resumenProyecto", out el)
                         || doc.RootElement.TryGetProperty("ResumenProyecto", out el)
                         || doc.RootElement.TryGetProperty("descripcion", out el)
                         || doc.RootElement.TryGetProperty("Descripcion", out el))
                        {
                            desc = el.GetString() ?? "";
                        }
                    }
                    catch {}
                }

                if (string.IsNullOrWhiteSpace(desc))
                {
                    try
                    {
                        var instance = await _context.DocumentInstances
                            .FirstOrDefaultAsync(i => i.EntityUuid == basicProject.Uuid && (i.TemplateCode == "PROTOCOLO_INNOVACION" || i.TemplateCode == "PROTOCOLO_INVESTIGACION"));

                        if (instance?.DataSnapshotJson != null)
                        {
                            using var docInst = System.Text.Json.JsonDocument.Parse(instance.DataSnapshotJson);
                            if (docInst.RootElement.TryGetProperty("descripcionProyecto", out var el) 
                             || docInst.RootElement.TryGetProperty("DescripcionProyecto", out el)
                             || docInst.RootElement.TryGetProperty("descripcionInnovacion", out el)
                             || docInst.RootElement.TryGetProperty("DescripcionInnovacion", out el)
                             || docInst.RootElement.TryGetProperty("resumenProyecto", out el)
                             || docInst.RootElement.TryGetProperty("ResumenProyecto", out el)
                             || docInst.RootElement.TryGetProperty("descripcion", out el)
                             || docInst.RootElement.TryGetProperty("Descripcion", out el))
                            {
                                desc = el.GetString() ?? "";
                            }
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
                    var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.HandlebarsTemplateEngine.CleanAndNormalizeJson(p.MetadataCacesJson);
                    var deserialized = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, ProyectoDto.DefaultDeserializerOptions);
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

            // Carga en lote de Profesores y Alumnos para evitar consultas N+1 por cada participante
            var profesoresDict = new Dictionary<string, Profesore>();
            if (profCedulas.Any())
            {
                var profCedulaLts = profCedulas.Select(c => c.Trim()).ToList();
                var profs = await _context.Profesores
                    .Where(prof => profCedulaLts.Contains(prof.IdProfesor))
                    .ToListAsync();
                profesoresDict = profs
                    .GroupBy(prof => prof.IdProfesor.Trim(), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
            }

            var alumnosDict = new Dictionary<string, Alumno>();
            if (studentCedulas.Any())
            {
                var studentCedulaLts = studentCedulas.Select(c => c.Trim()).ToList();
                var alums = await _context.Alumnos
                    .Where(alum => studentCedulaLts.Contains(alum.IdAlumno))
                    .ToListAsync();
                alumnosDict = alums
                    .GroupBy(alum => alum.IdAlumno.Trim(), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
            }

            var investigadoresList = new List<InvestigadorDto>();

            foreach (var pp in p.InvProyectoParticipantes.Where(pp => pp.TipoParticipante == "Docente"))
            {
                var phone = pp.Telefono ?? string.Empty;
                var email = pp.IdUsuarioNavigation?.EmailInstitucional ?? pp.IdUsuarioNavigation?.IdSigafi ?? "";
                var cedula = pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";

                if (pp.IdUsuarioNavigation?.TablaSigafi == "profesor" && profesoresDict.TryGetValue(cedula, out var prof))
                {
                    if (string.IsNullOrEmpty(phone)) phone = prof.Celular ?? prof.Telefono ?? string.Empty;
                    email = prof.EmailInstitucional ?? prof.Email ?? email;
                }
                else if (pp.IdUsuarioNavigation?.TablaSigafi == "alumno" && alumnosDict.TryGetValue(cedula, out var alum))
                {
                    if (string.IsNullOrEmpty(phone)) phone = alum.Celular ?? alum.Telefono ?? string.Empty;
                    email = alum.EmailInstitucional ?? alum.Email ?? email;
                }

                if (string.IsNullOrEmpty(email)) email = pp.IdUsuarioNavigation?.EmailInstitucional ?? pp.IdUsuarioNavigation?.IdSigafi ?? "";

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
                var phone = pa.Telefono ?? string.Empty;
                var email = pa.IdUsuarioNavigation?.EmailInstitucional ?? pa.IdUsuarioNavigation?.IdSigafi ?? "";
                var cedula = pa.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";

                if (pa.IdUsuarioNavigation?.TablaSigafi == "profesor" && profesoresDict.TryGetValue(cedula, out var prof))
                {
                    if (string.IsNullOrEmpty(phone)) phone = prof.Celular ?? prof.Telefono ?? string.Empty;
                    email = prof.EmailInstitucional ?? prof.Email ?? email;
                }
                else if (pa.IdUsuarioNavigation?.TablaSigafi == "alumno" && alumnosDict.TryGetValue(cedula, out var alum))
                {
                    if (string.IsNullOrEmpty(phone)) phone = alum.Celular ?? alum.Telefono ?? string.Empty;
                    email = alum.EmailInstitucional ?? alum.Email ?? email;
                }

                if (string.IsNullOrEmpty(email)) email = pa.IdUsuarioNavigation?.EmailInstitucional ?? pa.IdUsuarioNavigation?.IdSigafi ?? "";

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
                .Select(pp => pp.IdUsuarioNavigation!.Nombre)
                .FirstOrDefault()
                ?? p.InvProyectoParticipantes
                .Where(pp => pp.IdUsuarioNavigation != null && pp.TipoParticipante == "Docente")
                .Select(pp => pp.IdUsuarioNavigation!.Nombre)
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
