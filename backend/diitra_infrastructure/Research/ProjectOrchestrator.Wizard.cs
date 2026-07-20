using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research
{
    public partial class ProjectOrchestrator : IProjectOrchestrator
    {
        public async Task<SyncResult> SyncProjectWizardDataAsync(ProyectoDto dto, string? creatorUserIdRef = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Localizar o Crear el Proyecto Core
                InvProyecto? project = null;
                if (!string.IsNullOrEmpty(dto.Uuid))
                {
                    project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == dto.Uuid);
                }

                string? beforeJson = null;
                if (project != null)
                {
                    // 1.1 Bloqueo de Integridad por Estado
                    var estadosEditablesRaw = await _context.InvConfigsGenerales
                        .Where(c => c.Clave == "Workflow.EstadosEditables")
                        .Select(c => c.Valor)
                        .FirstOrDefaultAsync() ?? "Borrador,En Corrección";
                    var estadosEditables = estadosEditablesRaw.Split(',').Select(s => s.Trim()).ToList();
                    estadosEditables.Add("Prepropuesta");
                    estadosEditables.Add("Prepropuesta Rechazada");
                    if (!estadosEditables.Contains(project.Estado))
                    {
                        return new SyncResult { Success = false, Message = $"El proyecto [{project.Estado}] está blindado y no permite modificaciones." };
                    }

                    var beforeState = new
                    {
                        Titulo = project.Titulo,
                        CodigoInstitucional = project.CodigoInstitucional,
                        TiempoEjecucion = project.TiempoEjecucion,
                        TieneGrupoInvestigacion = project.TieneGrupo,
                        IdGrupo = project.IdGrupo,
                        IdConvocatoria = project.IdConvocatoria,
                        IdObjetivoPnd = project.IdObjetivoPnd,
                        IdEntidadAliada = project.IdEntidadAliada,
                        TrlInicial = project.TrlInicial,
                        TrlActual = project.TrlActual,
                        TrlMeta = project.TrlMeta,
                        Estado = project.Estado
                    };
                    beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);
                }
                else
                {
                    project = new InvProyecto
                    {
                        Uuid = dto.Uuid ?? Guid.NewGuid().ToString(),
                        FechaRegistro = DateTime.Now,
                        Estado = string.IsNullOrEmpty(dto.Estado) ? "Prepropuesta" : dto.Estado
                    };
                    _context.InvProyectos.Add(project);
                }

                // 2. Mapeo de Atributos Nucleares
                project.Titulo = dto.Titulo ?? "PROYECTO SIN TÍTULO";
                project.CodigoInstitucional = dto.CodigoInstitucional;
                project.TiempoEjecucion = dto.TiempoEjecucion;
                project.FechaPresentacion = ParseDateOnly(dto.FechaPresentacion);
                project.FechaInicio = ParseDateOnly(dto.FechaInicio ?? dto.FechaInicioEstimada);
                project.FechaFin = ParseDateOnly(dto.FechaFin ?? dto.FechaFinEstimada);
                project.PresupuestoEstimado = dto.CostoTotal;

                // Cumplimiento CACES
                bool isAssociative = dto.TieneGrupoInvestigacion == true ||
                                     dto.GrupoInvestigacionTipo == "SI" ||
                                     dto.GrupoInvestigacionTipo == "si";

                if (isAssociative)
                {
                    var groupUuid = dto.GrupoInvestigacionUuid ?? dto.GrupoInvestigacion ?? dto.GrupoInvestigacionNombre;
                    if (string.IsNullOrWhiteSpace(groupUuid))
                    {
                        return new SyncResult
                        {
                            Success = false,
                            Message = "Para proyectos asociativos debe seleccionar un grupo de investigación aprobado."
                        };
                    }

                    var approvedGroup = await ResolveApprovedGroupAsync(groupUuid);
                    if (approvedGroup == null)
                    {
                        return new SyncResult
                        {
                            Success = false,
                            Message = "El grupo seleccionado no existe o no está aprobado/activo."
                        };
                    }

                    project.TieneGrupo = true;
                    project.IdGrupo = approvedGroup.IdGrupo;
                    dto.GrupoInvestigacion = approvedGroup.Nombre;
                    dto.GrupoInvestigacionUuid = approvedGroup.Uuid;
                    dto.TieneGrupoInvestigacion = true;
                    dto.GrupoInvestigacionTipo = "SI";
                    dto.GrupoInvestigacionNombre = approvedGroup.Nombre;

                    dto.Investigadores = await BuildProjectInvestigadoresFromGroupAsync(approvedGroup.IdGrupo, project.IdProyecto, dto.Investigadores);
                }
                else
                {
                    project.TieneGrupo = false;
                    project.IdGrupo = null;
                    dto.GrupoInvestigacion = null;
                    dto.GrupoInvestigacionUuid = null;
                    dto.TieneGrupoInvestigacion = false;
                    dto.GrupoInvestigacionTipo = "NO";
                    dto.GrupoInvestigacionNombre = null;
                }

                if (dto.IdConvocatoria.HasValue && dto.IdConvocatoria.Value > 0)
                {
                    if (project.IdConvocatoria != dto.IdConvocatoria.Value)
                    {
                        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.IdConvocatoria == dto.IdConvocatoria.Value);
                        if (conv != null)
                        {
                            var today = DateOnly.FromDateTime(DateTime.Today);
                            if (conv.FechaCierre < today)
                            {
                                return new SyncResult
                                {
                                    Success = false,
                                    Message = $"La convocatoria \"{conv.Titulo}\" cerró el {conv.FechaCierre:dd/MM/yyyy} y no acepta nuevas postulaciones."
                                };
                            }
                        }
                    }
                    project.IdConvocatoria = dto.IdConvocatoria.Value;
                }
                else
                {
                    project.IdConvocatoria = null;
                }
                project.IdObjetivoPnd = (dto.IdObjetivoPnd.HasValue && dto.IdObjetivoPnd.Value > 0) ? dto.IdObjetivoPnd.Value : null;

                // Sincronización de Programa
                if (!string.IsNullOrEmpty(dto.Programa))
                {
                    var prog = await _context.InvProgramas.FirstOrDefaultAsync(pr => pr.Nombre == dto.Programa && pr.Activo == true);
                    if (prog != null)
                    {
                        project.IdPrograma = prog.IdPrograma;
                    }
                }
                else
                {
                    project.IdPrograma = null;
                }

                // Sincronización de Tipo de Investigación
                if (!string.IsNullOrEmpty(dto.TipoInvestigacion))
                {
                    var searchName = dto.TipoInvestigacion.Trim().ToUpper()
                        .Replace("Á", "A")
                        .Replace("É", "E")
                        .Replace("Í", "I")
                        .Replace("Ó", "O")
                        .Replace("Ú", "U");

                    var tip = await _context.InvTiposInvestigacion.FirstOrDefaultAsync(t => 
                        (t.Nombre.ToUpper() == searchName || 
                         t.Nombre.ToUpper().Replace("Á", "A").Replace("É", "E").Replace("Í", "I").Replace("Ó", "O").Replace("Ú", "U") == searchName) && 
                        t.Activo == true);

                    if (tip != null)
                    {
                        project.IdTipo = tip.IdTipo;
                    }
                }
                else
                {
                    project.IdTipo = null;
                }

                // Sincronización de Sublínea (Línea de Investigación)
                if (!string.IsNullOrEmpty(dto.SublineaInvestigacion))
                {
                    var sub = await _context.InvSublineas.FirstOrDefaultAsync(s => s.Nombre == dto.SublineaInvestigacion && s.Activo == true);
                    if (sub != null)
                    {
                        project.IdSublinea = sub.IdSublinea;
                    }
                }
                else
                {
                    project.IdSublinea = null;
                }

                // Núcleo Innovación & TRL
                project.IdEntidadAliada = (dto.IdEntidadAliada.HasValue && dto.IdEntidadAliada.Value > 0) ? dto.IdEntidadAliada.Value : null;
                project.TrlInicial = (sbyte?)(dto.TrlInicial ?? 1);
                project.TrlActual = (sbyte?)(dto.TrlActual ?? 1);
                project.TrlMeta = (sbyte?)(dto.TrlMeta ?? 1);

                // Persistencia Completa en Metadata
                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                await SaveChangesWithConcurrencyResolutionAsync(); // Aseguramos ID del proyecto

                // Sincronización de Dominio Académico
                var oldDominios = _context.InvProyectosDominios.Where(pd => pd.IdProyecto == project.IdProyecto);
                _context.InvProyectosDominios.RemoveRange(oldDominios);

                if (!string.IsNullOrEmpty(dto.Dominio))
                {
                    var dom = await _context.InvDominios.FirstOrDefaultAsync(d => d.Nombre == dto.Dominio && d.Activo == true);
                    if (dom != null)
                    {
                        _context.InvProyectosDominios.Add(new InvProyectoDominio
                        {
                            IdProyecto = project.IdProyecto,
                            IdDominio = dom.IdDominio
                        });
                    }
                }

                // Sincronización de Carreras
                await SyncProjectCarrerasAsync(project.IdProyecto, dto.IdCarrera, dto.Investigadores);

                // Sincronización automática de miembros de grupo
                if (project.TieneGrupo == true && project.IdGrupo.HasValue)
                {
                    var groupMembers = await _context.InvGruposMiembros
                        .Include(m => m.IdUsuarioNavigation)
                        .Where(m => m.IdGrupo == project.IdGrupo.Value && m.Activo != false)
                        .ToListAsync();

                    if (dto.Investigadores == null)
                    {
                        dto.Investigadores = new List<InvestigadorDto>();
                    }

                    foreach (var member in groupMembers)
                    {
                        var user = member.IdUsuarioNavigation;
                        if (user == null) continue;

                        var alreadyAdded = dto.Investigadores.Any(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == user.IdSigafi.Trim());
                        if (!alreadyAdded)
                        {
                            var phone = await GetUserPhoneFromCatalogAsync(user.IdSigafi, user.TablaSigafi);
                            dto.Investigadores.Add(new InvestigadorDto
                            {
                                Nombre = user.Nombre,
                                Cedula = user.IdSigafi,
                                Email = user.EmailInstitucional ?? user.IdSigafi ?? "",
                                Rol = member.Rol ?? "Co-Investigador",
                                NivelAcademico = user.TablaSigafi == "alumno" ? "Pregrado" : "Tercer Nivel",
                                Telefono = phone,
                                Activo = true,
                                FechaInicio = DateTime.Now,
                                EsDirector = member.Rol?.Contains("Director", StringComparison.OrdinalIgnoreCase) == true
                            });
                        }
                    }

                    // Asegurar que el JSON guardado también refleje la lista sincronizada
                    project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                }

                // 3. Sincronización de Equipo
                if (dto.Investigadores != null && dto.Investigadores.Count > 0)
                {
                    await SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores, isFromWizard: true);
                }

                // Auto-vincular al creador como Director
                if (!string.IsNullOrEmpty(creatorUserIdRef))
                {
                    var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == creatorUserIdRef);
                    if (internalUser != null && !await IsOversightUserAsync(internalUser.IdUsuario))
                    {
                        var isLinked = await _context.InvProyectoParticipantes.AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == internalUser.IdUsuario);
 
                        if (!isLinked)
                        {
                            var phone = await GetUserPhoneFromCatalogAsync(internalUser.IdSigafi, internalUser.TablaSigafi);
                            if (internalUser.TablaSigafi == "alumno")
                            {
                                _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                                {
                                    IdProyecto = project.IdProyecto,
                                    IdUsuario = internalUser.IdUsuario,
                                    TipoParticipante = "Alumno",
                                    Rol = "Semillerista",
                                    NivelAcademico = "Pregrado",
                                    Telefono = phone,
                                    EsDirector = false,
                                    Activo = true,
                                    FechaInicio = DateTime.Now
                                });
                            }
                            else
                            {
                                _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                                {
                                    IdProyecto = project.IdProyecto,
                                    IdUsuario = internalUser.IdUsuario,
                                    TipoParticipante = "Docente",
                                    Rol = "Director de Proyecto",
                                    NivelAcademico = "Tercer Nivel",
                                    Telefono = phone,
                                    EsDirector = true,
                                    Activo = true,
                                    FechaInicio = DateTime.Now
                                });
                            }
                        }
                    }
                }

                // 4. Sincronización de Objetivos
                var objetivosCreadosIds = await SyncObjetivosAsync(project.IdProyecto, dto.ObjetivoGeneral, dto.ObjetivosEspecificos);
                int defaultObjetivoId = objetivosCreadosIds.FirstOrDefault();

                // 5. Sincronización de Presupuesto
                await SyncPresupuestoAsync(project.IdProyecto, dto.RecursosNecesarios);

                // 6. Sincronización de MML
                await SyncMmlAsync(project.IdProyecto, dto.MatrizMarcoLogico);

                // 7. Sincronización de Impactos
                await SyncImpactosAsync(project.IdProyecto, dto.Impacto);

                // 8. Sincronización de Productos
                await SyncProductosAsync(project.IdProyecto, dto.ProductosEsperados);

                // 9. Sincronización de Cronograma
                await SyncCronogramaAsync(project.IdProyecto, objetivosCreadosIds, dto.Cronograma);

                // 10. Sincronización de Bibliografía
                await SyncBibliografiaAsync(project.IdProyecto, dto.Bibliografia);

                // 11. Sincronización de Recursos Disponibles
                await SyncRecursosDisponiblesAsync(project.IdProyecto, dto.RecursosDisponibles);

                await SaveChangesWithConcurrencyResolutionAsync();
                await transaction.CommitAsync();

                var afterState = new
                {
                    Titulo = project.Titulo,
                    CodigoInstitucional = project.CodigoInstitucional,
                    TiempoEjecucion = project.TiempoEjecucion,
                    TieneGrupoInvestigacion = project.TieneGrupo,
                    IdGrupo = project.IdGrupo,
                    IdConvocatoria = project.IdConvocatoria,
                    IdObjetivoPnd = project.IdObjetivoPnd,
                    IdEntidadAliada = project.IdEntidadAliada,
                    TrlInicial = project.TrlInicial,
                    TrlActual = project.TrlActual,
                    TrlMeta = project.TrlMeta,
                    Estado = project.Estado
                };
                string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

                await _auditService.LogActionAsync(
                    null,
                    project.Estado == "Borrador" && dto.Uuid == null ? "CREAR_PROYECTO" : "ACTUALIZAR_PROYECTO",
                    $"Sincronización de datos del proyecto: {project.Titulo}",
                    "PROYECTOS",
                    beforeJson,
                    afterJson
                );

                return new SyncResult { Success = true, Uuid = project.Uuid };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error crítico en SyncProjectWizardData para UUID: {Uuid}", dto.Uuid);
                return new SyncResult { Success = false, Message = ex.Message, Uuid = dto.Uuid };
            }
        }

        private async Task SyncProjectCarrerasAsync(int projectId, int? idCarreraPrincipal, List<InvestigadorDto>? investigadores)
        {
            var currentCarreras = await _context.InvProyectosCarreras.Where(pc => pc.IdProyecto == projectId).ToListAsync();
            _context.InvProyectosCarreras.RemoveRange(currentCarreras);

            if (idCarreraPrincipal.HasValue && idCarreraPrincipal.Value > 0)
            {
                _context.InvProyectosCarreras.Add(new InvProyectoCarrera
                {
                    IdProyecto = projectId,
                    IdCarrera = idCarreraPrincipal.Value,
                    Modalidad = "PRINCIPAL"
                });
            }

            if (investigadores != null && investigadores.Any())
            {
                var allCarreras = await _context.Carreras.AsNoTracking().ToListAsync();
                var addedCarrerasIds = new HashSet<int>();
                if (idCarreraPrincipal.HasValue)
                {
                    addedCarrerasIds.Add(idCarreraPrincipal.Value);
                }

                foreach (var inv in investigadores)
                {
                    if (inv.Activo == false) continue;
                    if (string.IsNullOrWhiteSpace(inv.Carrera)) continue;

                    var carreraNombres = inv.Carrera.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                                   .Select(c => c.Trim().ToLower())
                                                   .ToList();

                    foreach (var cName in carreraNombres)
                    {
                        var matchedCarrera = allCarreras.FirstOrDefault(c =>
                            c.Carrera1 != null && c.Carrera1.Trim().ToLower() == cName);

                        if (matchedCarrera != null && !addedCarrerasIds.Contains(matchedCarrera.IdCarrera))
                        {
                            addedCarrerasIds.Add(matchedCarrera.IdCarrera);
                            _context.InvProyectosCarreras.Add(new InvProyectoCarrera
                            {
                                IdProyecto = projectId,
                                IdCarrera = matchedCarrera.IdCarrera,
                                Modalidad = "PARTICIPANTE"
                            });
                        }
                    }
                }
            }
        }

        private async Task SyncInvestigadoresAsync(int projectId, System.Collections.Generic.List<InvestigadorDto>? investigadores, bool isFromWizard = false)
        {
            if (investigadores == null) return;

            // 1. Obtener los integrantes actuales de la base de datos
            var currentParticipants = await _context.InvProyectoParticipantes
                .Include(pp => pp.IdUsuarioNavigation)
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            var currentProfs = currentParticipants.Where(pp => pp.TipoParticipante == "Docente").ToList();
            var currentAlums = currentParticipants.Where(pp => pp.TipoParticipante == "Alumno").ToList();

            // Guardar cédulas activas recibidas
            var activeCedulas = investigadores
                .Where(i => !string.IsNullOrEmpty(i.Cedula) && i.Activo != false)
                .Select(i => i.Cedula!.Trim())
                .ToHashSet();

            // 2. Procesar Profesores Existentes: Desactivar los que ya no vienen en la lista
            if (!isFromWizard)
            {
                foreach (var prof in currentProfs)
                {
                    var cedula = prof.IdUsuarioNavigation?.IdSigafi?.Trim();
                    if (cedula != null && prof.Activo != false && !activeCedulas.Contains(cedula))
                    {
                        prof.Activo = false;
                        prof.FechaFin = DateTime.Now;
                        prof.MotivoCambio = "Retirado del equipo";
                        prof.EsDirector = false;
                    }
                }
            }

            // 3. Procesar Alumnos Existentes: Desactivar los que ya no vienen en la lista
            if (!isFromWizard)
            {
                foreach (var alum in currentAlums)
                {
                    var cedula = alum.IdUsuarioNavigation?.IdSigafi?.Trim();
                    if (cedula != null && alum.Activo != false && !activeCedulas.Contains(cedula))
                    {
                        alum.Activo = false;
                        alum.FechaFin = DateTime.Now;
                        alum.MotivoCambio = "Retirado del equipo";
                    }
                }
            }

            var investigatorsToNotify = new List<InvestigadorDto>();

            // 4. Procesar la lista entrante
            foreach (var inv in investigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;

                var cedulaTrim = inv.Cedula.Trim();
                var persona = await _authService.GetOrProvisionUserByCedulaAsync(cedulaTrim);
                if (persona == null) continue;

                bool esDirector = inv.Rol?.Contains("Director") == true;

                if (persona.TablaSigafi == "alumno")
                {
                    var existingAlum = currentAlums.FirstOrDefault(pa => pa.IdUsuario == persona.IdUsuario);
                    if (existingAlum != null)
                    {
                        if (isFromWizard)
                        {
                            existingAlum.Telefono = inv.Telefono;
                            existingAlum.HorasSemanales = inv.HorasSemanales;
                        }
                        else
                        {
                            bool wasActive = existingAlum.Activo != false;
                            string oldRol = existingAlum.Rol ?? "";
                            string newRol = NormalizeRole(inv.Rol);

                            existingAlum.Rol = newRol;
                            existingAlum.NivelAcademico = inv.NivelAcademico;
                            existingAlum.Telefono = inv.Telefono;
                            existingAlum.HorasSemanales = inv.HorasSemanales;

                            bool nowActive = true;
                            if (inv.Activo == false)
                            {
                                nowActive = false;
                                if (existingAlum.Activo != false)
                                {
                                    existingAlum.Activo = false;
                                    existingAlum.FechaFin = DateTime.Now;
                                    existingAlum.MotivoCambio = "Retirado del equipo";
                                }
                            }
                            else
                            {
                                if (existingAlum.Activo == false)
                                {
                                    existingAlum.Activo = true;
                                    existingAlum.FechaInicio = DateTime.Now;
                                    existingAlum.FechaFin = null;
                                    existingAlum.MotivoCambio = null;
                                }
                            }

                            if (nowActive && (!wasActive || !string.Equals(oldRol, newRol, StringComparison.OrdinalIgnoreCase)))
                            {
                                investigatorsToNotify.Add(inv);
                            }
                        }
                    }
                    else if (!isFromWizard)
                    {
                        _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                        {
                            IdProyecto = projectId,
                            IdUsuario = persona.IdUsuario,
                            TipoParticipante = "Alumno",
                            Rol = NormalizeRole(inv.Rol),
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = !string.IsNullOrEmpty(inv.Telefono) ? inv.Telefono : await GetUserPhoneFromCatalogAsync(persona.IdSigafi, persona.TablaSigafi),
                            HorasSemanales = inv.HorasSemanales,
                            Activo = inv.Activo ?? true,
                            EsDirector = false,
                            FechaInicio = DateTime.Now,
                            FechaFin = inv.Activo == false ? DateTime.Now : null,
                            MotivoCambio = inv.Activo == false ? "Retirado del equipo" : null
                        });

                        if (inv.Activo != false)
                        {
                            investigatorsToNotify.Add(inv);
                        }
                    }
                }
                else
                {
                    var existingProf = currentProfs.FirstOrDefault(pp => pp.IdUsuario == persona.IdUsuario);
                    if (existingProf != null)
                    {
                        if (isFromWizard)
                        {
                            existingProf.Telefono = inv.Telefono;
                            existingProf.HorasSemanales = inv.HorasSemanales;
                        }
                        else
                        {
                            bool wasActive = existingProf.Activo != false;
                            string oldRol = existingProf.Rol ?? "";
                            string newRol = NormalizeRole(inv.Rol);

                            existingProf.Rol = newRol;
                            existingProf.NivelAcademico = inv.NivelAcademico;
                            existingProf.Telefono = inv.Telefono;
                            existingProf.EsDirector = esDirector;
                            existingProf.HorasSemanales = inv.HorasSemanales;

                            bool nowActive = true;
                            if (inv.Activo == false)
                            {
                                nowActive = false;
                                if (existingProf.Activo != false)
                                {
                                    existingProf.Activo = false;
                                    existingProf.FechaFin = DateTime.Now;
                                    existingProf.MotivoCambio = "Retirado del equipo";
                                    existingProf.EsDirector = false;
                                }
                            }
                            else
                            {
                                if (existingProf.Activo == false)
                                {
                                    existingProf.Activo = true;
                                    existingProf.FechaInicio = DateTime.Now;
                                    existingProf.FechaFin = null;
                                    existingProf.MotivoCambio = null;
                                }
                            }

                            if (nowActive && (!wasActive || !string.Equals(oldRol, newRol, StringComparison.OrdinalIgnoreCase)))
                            {
                                investigatorsToNotify.Add(inv);
                            }
                        }
                    }
                    else if (!isFromWizard)
                    {
                        _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                        {
                            IdProyecto = projectId,
                            IdUsuario = persona.IdUsuario,
                            TipoParticipante = "Docente",
                            Rol = NormalizeRole(inv.Rol),
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = !string.IsNullOrEmpty(inv.Telefono) ? inv.Telefono : await GetUserPhoneFromCatalogAsync(persona.IdSigafi, persona.TablaSigafi),
                            EsDirector = esDirector,
                            HorasSemanales = inv.HorasSemanales,
                            Activo = inv.Activo ?? true,
                            FechaInicio = DateTime.Now,
                            FechaFin = inv.Activo == false ? DateTime.Now : null,
                            MotivoCambio = inv.Activo == false ? "Retirado del equipo" : null
                        });

                        if (inv.Activo != false)
                        {
                            investigatorsToNotify.Add(inv);
                        }
                    }
                }
            }

            if (investigatorsToNotify.Count > 0)
            {
                await NotifyInvestigadoresAsync(projectId, investigatorsToNotify);
            }
        }

        private async Task NotifyInvestigadoresAsync(int projectId, List<InvestigadorDto> investigadores)
        {
            var project = await _context.InvProyectos.FindAsync(projectId);
            if (project == null) return;

            var cedulas = investigadores
                .Where(i => !string.IsNullOrEmpty(i.Cedula))
                .Select(i => i.Cedula!.Trim())
                .Distinct()
                .ToList();

            if (cedulas.Count == 0) return;

            var personas = await _context.Users
                .Where(u => u.IdSigafi != null && cedulas.Contains(u.IdSigafi))
                .ToListAsync();

            var personasDict = personas
                .Where(p => p.IdSigafi != null)
                .ToDictionary(p => p.IdSigafi!, p => p);

            foreach (var inv in investigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;
                var cedulaTrim = inv.Cedula.Trim();

                if (personasDict.TryGetValue(cedulaTrim, out var persona))
                {
                    await _notificationService.NotifyUserAsync(
                        persona.IdUsuario,
                        "Actualización de Proyecto",
                        $"Se han sincronizado tus datos en el proyecto: {project.Titulo}",
                        "INVESTIGACION",
                        $"/proyectos/{project.Uuid}",
                        new Dictionary<string, string>
                        {
                            { "Proyecto", project.Titulo ?? "Sin título" },
                            { "Rol Asignado", inv.Rol ?? "Investigador" },
                            { "Fecha Sincronización", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
                        }
                    );
                }
            }
        }

        private List<string> ParseObjetivosHtml(System.Collections.Generic.List<string>? objetivos)
        {
            var result = new List<string>();
            if (objetivos == null) return result;

            foreach (var item in objetivos)
            {
                if (string.IsNullOrWhiteSpace(item)) continue;

                if (item.Contains("<li") || item.Contains("<p"))
                {
                    string cleaned = item.Replace("<ul>", "").Replace("</ul>", "").Replace("<ol>", "").Replace("</ol>", "");

                    var matches = System.Text.RegularExpressions.Regex.Matches(cleaned, @"<(li|p)[^>]*>(.*?)<\/\1>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (matches.Count > 0)
                    {
                        foreach (System.Text.RegularExpressions.Match match in matches)
                        {
                            var text = System.Text.RegularExpressions.Regex.Replace(match.Groups[2].Value, @"<[^>]*>", "").Trim();
                            text = System.Net.WebUtility.HtmlDecode(text);
                            text = System.Text.RegularExpressions.Regex.Replace(text, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();

                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                result.Add(text);
                            }
                        }
                    }
                    else
                    {
                        var cleanText = System.Text.RegularExpressions.Regex.Replace(item, @"<[^>]*>", "").Trim();
                        cleanText = System.Net.WebUtility.HtmlDecode(cleanText);
                        cleanText = System.Text.RegularExpressions.Regex.Replace(cleanText, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();
                        if (!string.IsNullOrWhiteSpace(cleanText))
                        {
                            result.Add(cleanText);
                        }
                    }
                }
                else
                {
                    var text = System.Text.RegularExpressions.Regex.Replace(item, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        result.Add(text);
                    }
                }
            }

            return result;
        }

        private async Task<List<int>> SyncObjetivosAsync(int projectId, string? objetivoGeneral, System.Collections.Generic.List<string>? objetivos)
        {
            var generalOpt = await _context.InvObjetivosProyecto.FirstOrDefaultAsync(o => o.IdProyecto == projectId && o.EsGeneral);

            string descGeneral = !string.IsNullOrWhiteSpace(objetivoGeneral) ? objetivoGeneral : "Objetivo General por definir";
            if (descGeneral.Contains("<"))
            {
                descGeneral = System.Text.RegularExpressions.Regex.Replace(descGeneral, @"<[^>]*>", "").Trim();
                descGeneral = System.Net.WebUtility.HtmlDecode(descGeneral);
            }

            if (generalOpt != null)
            {
                generalOpt.Descripcion = descGeneral;
            }
            else
            {
                generalOpt = new InvObjetivoProyecto
                {
                    IdProyecto = projectId,
                    Descripcion = descGeneral,
                    EsGeneral = true,
                    Orden = 0
                };
                _context.InvObjetivosProyecto.Add(generalOpt);
            }
            await SaveChangesWithConcurrencyResolutionAsync();
            int generalId = generalOpt.IdObjetivo;

            var ids = new List<int> { generalId };

            var parsedObjetivos = ParseObjetivosHtml(objetivos);
            if (parsedObjetivos.Count > 0)
            {
                var old = _context.InvObjetivosProyecto.Where(o => o.IdProyecto == projectId && !o.EsGeneral);
                _context.InvObjetivosProyecto.RemoveRange(old);

                int orden = 1;
                foreach (var obj in parsedObjetivos)
                {
                    _context.InvObjetivosProyecto.Add(new InvObjetivoProyecto
                    {
                        IdProyecto = projectId,
                        Descripcion = obj,
                        EsGeneral = false,
                        Orden = orden++
                    });
                }

                await SaveChangesWithConcurrencyResolutionAsync();

                var creadosIds = await _context.InvObjetivosProyecto
                    .Where(o => o.IdProyecto == projectId && !o.EsGeneral)
                    .OrderBy(o => o.Orden)
                    .Select(o => o.IdObjetivo)
                    .ToListAsync();

                ids.AddRange(creadosIds);
            }

            return ids;
        }

        private async Task SyncPresupuestoAsync(int projectId, System.Collections.Generic.List<RecursoNecesarioDto>? recursos)
        {
            if (recursos == null) return;

            var existing = await _context.InvPresupuestoItems
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            _context.InvPresupuestoItems.RemoveRange(existing);
            await _context.SaveChangesAsync();

            foreach (var r in recursos)
            {
                _context.InvPresupuestoItems.Add(new InvPresupuestoItem
                {
                    IdProyecto = projectId,
                    Categoria = "Gasto",
                    Detalle = r.Descripcion ?? "Sin detalle",
                    Cantidad = decimal.TryParse(r.Cantidad, out var c) ? c : 1,
                    ValorUnitario = r.CostoUnitario,
                    EsGastoCapital = r.EsGastoCapital ?? false,
                    IdPartida = r.IdPartida
                });
            }
        }

        private async Task SyncMmlAsync(int projectId, System.Collections.Generic.List<MmlRowDto>? mml)
        {
            if (mml == null) return;

            var existing = await _context.InvProyectosMml
                .Where(m => m.IdProyecto == projectId)
                .ToListAsync();

            var newResumenes = mml
                .Where(r => !string.IsNullOrWhiteSpace(r.Resumen))
                .Select(r => r.Resumen!.Trim())
                .ToHashSet();

            var toDelete = existing
                .Where(e => !newResumenes.Contains(e.ResumenNarrativo.Trim()))
                .ToList();
            _context.InvProyectosMml.RemoveRange(toDelete);

            var existingResumenes = existing
                .Select(e => e.ResumenNarrativo.Trim())
                .ToHashSet();

            foreach (var row in mml)
            {
                if (string.IsNullOrWhiteSpace(row.Resumen)) continue;
                if (existingResumenes.Contains(row.Resumen.Trim())) continue;
                _context.InvProyectosMml.Add(new InvProyectoMml
                {
                    IdProyecto = projectId,
                    Nivel = row.Nivel ?? "Desconocido",
                    ResumenNarrativo = row.Resumen,
                    Indicadores = row.Indicadores,
                    MediosVerificacion = row.Medios,
                    Supuestos = row.Supuestos
                });
            }
        }

        private async Task SyncImpactosAsync(int projectId, ImpactoProyectoDto? impacto)
        {
            if (impacto == null) return;

            var existing = await _context.InvImpactosProyecto
                .Where(i => i.IdProyecto == projectId)
                .ToListAsync();

            var newImpactos = new Dictionary<int, string?>
            {
                { 1, impacto.Social },
                { 2, impacto.Cientifico },
                { 3, impacto.Economico },
                { 4, impacto.Politico },
                { 5, impacto.Ambiental },
                { 6, impacto.Otro }
            };

            foreach (var kvp in newImpactos)
            {
                var existingItem = existing.FirstOrDefault(e => e.IdCatImpacto == kvp.Key);
                if (string.IsNullOrWhiteSpace(kvp.Value))
                {
                    if (existingItem != null) _context.InvImpactosProyecto.Remove(existingItem);
                    continue;
                }
                if (existingItem != null)
                    existingItem.Descripcion = kvp.Value;
                else
                    AddImpacto(projectId, kvp.Key, kvp.Value);
            }
        }

        private void AddImpacto(int projectId, int catId, string desc)
        {
            _context.InvImpactosProyecto.Add(new InvImpactoProyecto
            {
                IdProyecto = projectId,
                IdCatImpacto = catId,
                Descripcion = desc
            });
        }

        private async Task SyncProductosAsync(int projectId, System.Collections.Generic.List<ProductoEsperadoDto>? productos)
        {
            if (productos == null) return;

            var existing = await _context.InvProductos
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            var newTitulos = productos
                .Where(p => !string.IsNullOrWhiteSpace(p.Tipo))
                .Select(p => p.Tipo!.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newTitulos.Contains(e.Titulo.Trim())).ToList();
            _context.InvProductos.RemoveRange(toDelete);

            var existingTitulos = existing.Select(e => e.Titulo.Trim()).ToHashSet();

            foreach (var p in productos)
            {
                if (string.IsNullOrWhiteSpace(p.Tipo)) continue;
                if (existingTitulos.Contains(p.Tipo.Trim())) continue;

                var cat = await _context.InvCatTipoProductos.FirstOrDefaultAsync(c => c.Nombre == p.Tipo);
                _context.InvProductos.Add(new InvProducto
                {
                    IdProyecto = projectId,
                    IdTipoProducto = cat?.IdTipoProducto ?? 1,
                    Titulo = p.Tipo,
                    Cantidad = int.TryParse(p.Cantidad, out var cant) ? cant : 1
                });
            }
        }

        private async Task SyncCronogramaAsync(int projectId, List<int> objetivosCreadosIds, System.Collections.Generic.List<ActividadCronogramaDto>? cronograma)
        {
            if (cronograma == null) return;

            var oldActivities = await _context.InvCronogramas
                .Where(c => c.IdProyecto == projectId)
                .ToListAsync();

            _context.InvCronogramas.RemoveRange(oldActivities);

            int defaultObjetivoId = objetivosCreadosIds.FirstOrDefault();

            foreach (var act in cronograma)
            {
                if (string.IsNullOrWhiteSpace(act.Actividad)) continue;

                int dbObjetivoId = defaultObjetivoId;
                if (act.IdObjetivo.HasValue && objetivosCreadosIds.Count > 0)
                {
                    int index = act.IdObjetivo.Value;
                    if (index >= 0 && index < objetivosCreadosIds.Count)
                    {
                        dbObjetivoId = objetivosCreadosIds[index];
                    }
                }

                var nuevaAct = new InvCronograma
                {
                    IdProyecto = projectId,
                    IdObjetivo = dbObjetivoId,
                    NumeroActividad = act.Numero,
                    Descripcion = act.Actividad,
                    RecursosNecesarios = act.RecursosNecesarios,
                    Responsable = act.Responsable,
                    Entregable = act.Entregable,
                    Ponderacion = act.Ponderacion,
                    EsEntregableCaces = act.EsEntregableCaces ?? false,
                    FechaInicioPrevista = ParseDateOnly(act.FechaInicioPrevista),
                    FechaFinPrevista = ParseDateOnly(act.FechaFinPrevista)
                };

                _context.InvCronogramas.Add(nuevaAct);
            }
        }

        private static System.Collections.Generic.List<bool> GetSemanasCalculadas(DateOnly? pStart, DateOnly? pEnd, DateOnly? aStart, DateOnly? aEnd)
        {
            int totalWeeks = 12;
            if (pStart.HasValue && pEnd.HasValue && pEnd.Value > pStart.Value)
            {
                var startDt = new DateTime(pStart.Value.Year, pStart.Value.Month, pStart.Value.Day);
                var endDt = new DateTime(pEnd.Value.Year, pEnd.Value.Month, pEnd.Value.Day);
                var diffTime = endDt - startDt;
                int totalDays = (int)Math.Ceiling(diffTime.TotalDays) + 1;
                totalWeeks = (int)Math.Ceiling(totalDays / 7.0);
            }

            var list = new System.Collections.Generic.List<bool>();
            if (!pStart.HasValue)
            {
                for (int i = 0; i < totalWeeks; i++) list.Add(false);
                return list;
            }

            var projectStartDt = new DateTime(pStart.Value.Year, pStart.Value.Month, pStart.Value.Day);

            for (int w = 0; w < totalWeeks; w++)
            {
                var weekStart = projectStartDt.AddDays(w * 7);
                var weekEnd = weekStart.AddDays(6);

                bool active = false;
                if (aStart.HasValue && aEnd.HasValue)
                {
                    var actStartDt = new DateTime(aStart.Value.Year, aStart.Value.Month, aStart.Value.Day);
                    var actEndDt = new DateTime(aEnd.Value.Year, aEnd.Value.Month, aEnd.Value.Day);
                    active = actStartDt <= weekEnd && actEndDt >= weekStart;
                }

                list.Add(active);
            }
            return list;
        }

        private async Task SyncBibliografiaAsync(int projectId, System.Collections.Generic.List<string>? biblio)
        {
            if (biblio == null) return;

            var existing = await _context.InvBibliografiasProyecto
                .Where(b => b.IdProyecto == projectId)
                .ToListAsync();

            var newCitas = biblio
                .Where(b => !string.IsNullOrWhiteSpace(b))
                .Select(b => b.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newCitas.Contains(e.CitaApa.Trim())).ToList();
            _context.InvBibliografiasProyecto.RemoveRange(toDelete);

            var existingCitas = existing.Select(e => e.CitaApa.Trim()).ToHashSet();
            foreach (var b in biblio)
            {
                if (string.IsNullOrWhiteSpace(b) || existingCitas.Contains(b.Trim())) continue;
                _context.InvBibliografiasProyecto.Add(new InvBibliografiaProyecto
                {
                    IdProyecto = projectId,
                    CitaApa = b
                });
            }
        }

        private async Task SyncRecursosDisponiblesAsync(int projectId, System.Collections.Generic.List<RecursoDisponibleDto>? recursos)
        {
            if (recursos == null) return;

            var existing = await _context.InvRecursosDisponibles
                .Where(r => r.IdProyecto == projectId)
                .ToListAsync();

            var newDetalles = recursos
                .Where(r => !string.IsNullOrWhiteSpace(r.Descripcion))
                .Select(r => r.Descripcion!.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newDetalles.Contains(e.Detalle.Trim())).ToList();
            _context.InvRecursosDisponibles.RemoveRange(toDelete);

            var existingDetalles = existing.Select(e => e.Detalle.Trim()).ToHashSet();
            foreach (var r in recursos)
            {
                if (string.IsNullOrWhiteSpace(r.Descripcion) || existingDetalles.Contains(r.Descripcion.Trim())) continue;
                _context.InvRecursosDisponibles.Add(new InvRecursoDisponible
                {
                    IdProyecto = projectId,
                    Detalle = r.Descripcion,
                    Cantidad = decimal.TryParse(r.Cantidad, out var cantRec) ? cantRec : 0,
                    Fuente = r.Fuente
                });
            }
        }

        public async Task<SyncResult> DeleteProjectAsync(string uuid, string? userIdRef)
        {
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado o no existe." };
            }

            if (project.Estado != "Borrador" && project.Estado != "En Corrección" &&
                project.Estado != "Prepropuesta" && project.Estado != "Prepropuesta Rechazada")
            {
                return new SyncResult { Success = false, Message = "Solo se pueden eliminar prepropuestas y borradores de proyectos." };
            }

            string beforeJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Titulo = project.Titulo,
                CodigoInstitucional = project.CodigoInstitucional,
                Estado = project.Estado,
                DescripcionProyecto = "",
                Activo = project.Activo,
                FechaRegistro = project.FechaRegistro
            });

            var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
            int? internalUserId = internalUser?.IdUsuario;

            project.Eliminado = true;
            project.FechaEliminacion = DateTime.UtcNow;
            project.EliminadoPorUsuarioId = internalUserId;

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(internalUserId, "ELIMINAR_PROYECTO_TEMPORAL", $"Proyecto enviado a la papelera: {project.Titulo}", "PROYECTOS", beforeJson, null);

            return new SyncResult { Success = true };
        }

        public async Task<SyncResult> RestoreProjectAsync(string uuid, string? userIdRef)
        {
            var project = await _context.InvProyectos
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado o no existe." };
            }

            var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
            int? internalUserId = internalUser?.IdUsuario;

            project.Eliminado = false;
            project.FechaEliminacion = null;
            project.EliminadoPorUsuarioId = null;

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(internalUserId, "RESTAURAR_PROYECTO", $"Proyecto restaurado de la papelera: {project.Titulo}", "PROYECTOS", null, null);

            return new SyncResult { Success = true };
        }

        public async Task<SyncResult> PurgeProjectAsync(string uuid, string? userIdRef)
        {
            var project = await _context.InvProyectos
                .IgnoreQueryFilters()
                .Include(p => p.InvProyectosCarreras)
                .Include(p => p.InvProyectoParticipantes)
                .Include(p => p.InvObjetivosProyecto)
                .Include(p => p.InvPresupuestoItems)
                .Include(p => p.InvCronogramas)
                .Include(p => p.InvBibliografiasProyecto)
                .Include(p => p.InvImpactosProyecto)
                .Include(p => p.InvProductos)
                .Include(p => p.MatrizMarcoLogico)
                .Include(p => p.InvRecursosDisponibles)
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado o no existe." };
            }

            string beforeJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Titulo = project.Titulo,
                CodigoInstitucional = project.CodigoInstitucional,
                Estado = project.Estado,
                DescripcionProyecto = "",
                Activo = project.Activo,
                FechaRegistro = project.FechaRegistro
            });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.InvProyectosCarreras.RemoveRange(project.InvProyectosCarreras);
                _context.InvProyectoParticipantes.RemoveRange(project.InvProyectoParticipantes);
                _context.InvObjetivosProyecto.RemoveRange(project.InvObjetivosProyecto);
                _context.InvPresupuestoItems.RemoveRange(project.InvPresupuestoItems);

                _context.InvCronogramas.RemoveRange(project.InvCronogramas);
                _context.InvBibliografiasProyecto.RemoveRange(project.InvBibliografiasProyecto);
                _context.InvImpactosProyecto.RemoveRange(project.InvImpactosProyecto);
                _context.InvProductos.RemoveRange(project.InvProductos);
                _context.InvProyectosMml.RemoveRange(project.MatrizMarcoLogico);
                _context.InvRecursosDisponibles.RemoveRange(project.InvRecursosDisponibles);

                var trazabilidadLogs = await _context.InvTrazabilidadProyectos
                    .Where(t => t.IdProyecto == project.IdProyecto)
                    .ToListAsync();
                if (trazabilidadLogs.Any())
                {
                    _context.InvTrazabilidadProyectos.RemoveRange(trazabilidadLogs);
                }

                var docInstance = await _context.DocumentInstances.FirstOrDefaultAsync(di => di.EntityUuid == uuid);
                if (docInstance != null)
                {
                    _context.DocumentInstances.Remove(docInstance);
                }

                _context.InvProyectos.Remove(project);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
                int? internalUserId = internalUser?.IdUsuario;
                await _auditService.LogActionAsync(internalUserId, "ELIMINAR_PROYECTO", $"Eliminación física del borrador del proyecto: {project.Titulo}", "PROYECTOS", beforeJson, null);

                return new SyncResult { Success = true };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al eliminar físicamente borrador de proyecto UUID: {Uuid}", uuid);
                return new SyncResult { Success = false, Message = $"Error interno al eliminar el proyecto: {ex.Message}" };
            }
        }

        public async Task<SyncResult> UpdateProjectTeamAsync(string uuid, List<InvestigadorDto> investigadores, string? grupoInvestigacion = null, bool? tieneGrupoInvestigacion = null)
        {
            var project = await _context.InvProyectos
                .Include(p => p.InvProyectosCarreras)
                .FirstOrDefaultAsync(p => p.Uuid == uuid);
            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado." };
            }

            string beforeJson = project.MetadataCacesJson ?? "{}";

            var isAssociativeRequested = tieneGrupoInvestigacion ?? (investigadores.Count > 1 || !string.IsNullOrWhiteSpace(grupoInvestigacion));
            InvGrupoInvestigacion? approvedGroup = null;
            var effectiveInvestigadores = investigadores;

            if (isAssociativeRequested)
            {
                if (string.IsNullOrWhiteSpace(grupoInvestigacion))
                {
                    return new SyncResult
                    {
                        Success = false,
                        Message = "Para guardar un proyecto asociativo, debe seleccionar un grupo de investigación aprobado."
                    };
                }

                approvedGroup = await ResolveApprovedGroupAsync(grupoInvestigacion);
                if (approvedGroup == null)
                {
                    return new SyncResult
                    {
                        Success = false,
                        Message = "El grupo seleccionado no existe o no está aprobado/activo."
                    };
                }

                effectiveInvestigadores = await BuildProjectInvestigadoresFromGroupAsync(approvedGroup.IdGrupo, project.IdProyecto, investigadores);

                var activeDirector = await _context.InvProyectoParticipantes
                    .Include(pp => pp.IdUsuarioNavigation)
                    .FirstOrDefaultAsync(pp => pp.IdProyecto == project.IdProyecto && pp.EsDirector == true && pp.Activo != false && pp.TipoParticipante == "Docente");

                if (activeDirector != null && activeDirector.IdUsuarioNavigation != null && !string.IsNullOrEmpty(activeDirector.IdUsuarioNavigation.IdSigafi))
                {
                    var directorCedula = activeDirector.IdUsuarioNavigation.IdSigafi.Trim();
                    var alreadyAdded = effectiveInvestigadores.Any(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == directorCedula);
                    if (!alreadyAdded)
                    {
                        decimal? directorHours = activeDirector.HorasSemanales;
                        var incomingDirector = investigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == directorCedula);
                        if (incomingDirector != null)
                        {
                            directorHours = incomingDirector.HorasSemanales;
                        }

                        effectiveInvestigadores.Add(new InvestigadorDto
                        {
                            Nombre = activeDirector.IdUsuarioNavigation.Nombre,
                            Cedula = directorCedula,
                            Email = activeDirector.IdUsuarioNavigation.EmailInstitucional ?? activeDirector.IdUsuarioNavigation.IdSigafi ?? "",
                            Rol = "Director de Proyecto",
                            NivelAcademico = activeDirector.NivelAcademico,
                            Telefono = activeDirector.Telefono ?? string.Empty,
                            Activo = true,
                            HorasSemanales = directorHours,
                            FechaInicio = activeDirector.FechaInicio ?? DateTime.Now,
                            EsDirector = true
                        });
                    }
                }
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(p => p.EsInstituto == 1)
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();

            if (currentPeriod == null)
            {
                return new SyncResult { Success = false, Message = "No se ha configurado un período académico activo en el sistema." };
            }

            var researchSubcatId = await GetResearchSubcatIdAsync();
            var estadosConCarga = await GetEstadosConCargaHorariaAsync();

            foreach (var inv in effectiveInvestigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;

                var cedulaTrim = inv.Cedula.Trim();
                var persona = await _authService.GetOrProvisionUserByCedulaAsync(cedulaTrim);
                if (persona == null || persona.TablaSigafi == "alumno") continue;
                if (inv.Activo == false) continue;

                decimal proposedHours = inv.HorasSemanales ?? 0;

                var availableHours = await _context.ProfesoresActividades
                    .Where(pa => pa.IdProfesor.Trim() == persona.IdSigafi.Trim() && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                    .Select(pa => pa.HorasSemana)
                    .FirstOrDefaultAsync() ?? 0;

                var otherProjectsHours = await _context.InvProyectoParticipantes
                    .Where(pp => pp.TipoParticipante == "Docente" &&
                                 pp.IdUsuario == persona.IdUsuario &&
                                 pp.IdProyecto != project.IdProyecto &&
                                 pp.Activo != false &&
                                 pp.IdProyectoNavigation!.Activo != false &&
                                 estadosConCarga.Contains(pp.IdProyectoNavigation.Estado))
                    .SumAsync(pp => (decimal?)pp.HorasSemanales ?? 0);

                var totalProposedHours = otherProjectsHours + proposedHours;
                if (totalProposedHours > availableHours)
                {
                    return new SyncResult
                    {
                        Success = false,
                        Message = $"El docente {persona.Nombre} (C.I. {persona.IdSigafi}) excede el límite de carga horaria de investigación para el período académico activo. Horas disponibles en distributivo: {availableHours}h. Horas asignadas en otros proyectos: {otherProjectsHours}h. Horas propuestas en este proyecto: {proposedHours}h. Total: {totalProposedHours}h."
                    };
                }
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                ProyectoDto? dto = null;
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    try
                    {
                        var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(project.MetadataCacesJson);
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    }
                    catch { }
                }

                if (dto == null)
                {
                    dto = new ProyectoDto
                    {
                        Uuid = project.Uuid,
                        Titulo = project.Titulo,
                        Estado = project.Estado,
                        CodigoInstitucional = project.CodigoInstitucional
                    };
                }

                if (isAssociativeRequested)
                {
                    if (approvedGroup == null)
                    {
                        return new SyncResult { Success = false, Message = "No se pudo resolver el grupo aprobado." };
                    }

                    project.TieneGrupo = true;
                    project.IdGrupo = approvedGroup.IdGrupo;
                    dto.TieneGrupoInvestigacion = true;
                    dto.GrupoInvestigacion = approvedGroup.Nombre;
                    dto.GrupoInvestigacionUuid = approvedGroup.Uuid;
                    dto.Investigadores = effectiveInvestigadores;
                }
                else
                {
                    project.TieneGrupo = false;
                    project.IdGrupo = null;
                    dto.TieneGrupoInvestigacion = false;
                    dto.GrupoInvestigacion = null;
                    dto.GrupoInvestigacionUuid = null;
                    dto.Investigadores = investigadores;
                }

                await SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores ?? new List<InvestigadorDto>(), isFromWizard: false);

                var principalCarrera = project.InvProyectosCarreras.FirstOrDefault(pc => pc.Modalidad == "PRINCIPAL")?.IdCarrera
                                       ?? project.InvProyectosCarreras.FirstOrDefault()?.IdCarrera;
                await SyncProjectCarrerasAsync(project.IdProyecto, principalCarrera, dto.Investigadores);

                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                var docInstance = await _context.DocumentInstances
                    .FirstOrDefaultAsync(di => di.EntityUuid == project.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                if (docInstance != null && !string.IsNullOrEmpty(docInstance.DataSnapshotJson))
                {
                    try
                    {
                        var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var snapshot = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(docInstance.DataSnapshotJson, options);
                        if (snapshot != null)
                        {
                            var merged = new Dictionary<string, object>();
                            foreach (var kvp in snapshot)
                            {
                                merged[kvp.Key] = kvp.Value;
                            }
                            merged["Investigadores"] = dto.Investigadores ?? new List<InvestigadorDto>();
                            merged["GrupoInvestigacionTipo"] = project.TieneGrupo == true ? "SI" : "NO";
                            merged["GrupoInvestigacionNombre"] = dto.GrupoInvestigacion ?? "";
                            merged["GrupoInvestigacionUuid"] = dto.GrupoInvestigacionUuid ?? "";
                            merged["TieneGrupoInvestigacion"] = project.TieneGrupo == true;

                            var newSnapshot = System.Text.Json.JsonSerializer.Serialize(merged);
                            docInstance.UpdateDataSnapshot(newSnapshot);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al sincronizar instantánea de documento desde UpdateProjectTeamAsync para proyecto UUID: {Uuid}", uuid);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                string afterJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    Titulo = project.Titulo,
                    CodigoInstitucional = project.CodigoInstitucional,
                    TieneGrupo = project.TieneGrupo,
                    TotalInvestigadores = dto.Investigadores?.Count ?? 0,
                    FechaModificacion = project.FechaModificacion
                });

                await _auditService.LogActionAsync(null, "ACTUALIZAR_EQUIPO_PROYECTO", $"Equipo actualizado del proyecto \"{project.Titulo}\"", "PROYECTOS", beforeJson, afterJson);

                return new SyncResult { Success = true, Uuid = uuid };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al actualizar equipo del proyecto UUID: {Uuid}", uuid);
                return new SyncResult { Success = false, Message = $"Error interno al actualizar el equipo: {ex.Message}" };
            }
        }

        public async Task<SyncResult> TransferDirectorAsync(string uuid, TransferDirectorRequest request)
        {
            var project = await _context.InvProyectos
                .Include(p => p.InvProyectoParticipantes).ThenInclude(pp => pp.IdUsuarioNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado." };
            }

            var currentDirectorForAudit = project.InvProyectoParticipantes
                .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false && pp.TipoParticipante == "Docente");

            var beforeState = new
            {
                Titulo = project.Titulo,
                CodigoInstitucional = project.CodigoInstitucional,
                DirectorActual = currentDirectorForAudit?.IdUsuarioNavigation?.Nombre ?? "Sin director",
                Estado = project.Estado
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var currentDirector = project.InvProyectoParticipantes
                    .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false && pp.TipoParticipante == "Docente");

                if (currentDirector != null)
                {
                    currentDirector.Activo = false;
                    currentDirector.FechaFin = DateTime.Now;
                    currentDirector.MotivoCambio = $"Relevado por: {request.Motivo}";
                    currentDirector.EsDirector = false;

                    await _notificationService.NotifyUserAsync(
                        currentDirector.IdUsuario,
                        "Relevo de Dirección de Proyecto",
                        $"Has sido relevado como director en el proyecto: {project.Titulo}. Motivo: {request.Motivo}",
                        "INVESTIGACION",
                        $"/proyectos/{project.Uuid}",
                        new Dictionary<string, string>
                        {
                            { "Proyecto", project.Titulo ?? "Sin título" },
                            { "Rol Anterior", "Director de Proyecto" },
                            { "Motivo del Relevo", request.Motivo },
                            { "Fecha de Cambio", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
                        }
                    );
                }

                var nuevoDirectorUser = await _authService.GetOrProvisionUserByCedulaAsync(request.NuevoDirectorCedula.Trim());
                if (nuevoDirectorUser == null)
                {
                    return new SyncResult { Success = false, Message = "No se pudo encontrar o registrar al nuevo director institucional." };
                }

                var existingProf = project.InvProyectoParticipantes
                    .FirstOrDefault(pp => pp.IdUsuario == nuevoDirectorUser.IdUsuario && pp.TipoParticipante == "Docente");

                if (existingProf != null)
                {
                    existingProf.Rol = "Director de Proyecto";
                    existingProf.EsDirector = true;
                    existingProf.Activo = true;
                    existingProf.FechaInicio = DateTime.Now;
                    existingProf.FechaFin = null;
                    existingProf.MotivoCambio = null;
                }
                else
                {
                    var phone = await GetUserPhoneFromCatalogAsync(nuevoDirectorUser.IdSigafi, nuevoDirectorUser.TablaSigafi);
                    _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                    {
                        IdProyecto = project.IdProyecto,
                        IdUsuario = nuevoDirectorUser.IdUsuario,
                        TipoParticipante = "Docente",
                        Rol = "Director de Proyecto",
                        NivelAcademico = "Tercer Nivel",
                        Telefono = phone,
                        EsDirector = true,
                        Activo = true,
                        FechaInicio = DateTime.Now
                    });
                }

                await _notificationService.NotifyUserAsync(
                    nuevoDirectorUser.IdUsuario,
                    "Designación como Director de Proyecto",
                    $"Has sido designado como el nuevo Director del proyecto: {project.Titulo}",
                    "INVESTIGACION",
                    $"/proyectos/{project.Uuid}",
                    new Dictionary<string, string>
                    {
                        { "Proyecto", project.Titulo ?? "Sin título" },
                        { "Nuevo Rol", "Director de Proyecto" },
                        { "Motivo de Designación", request.Motivo },
                        { "Fecha de Designación", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
                    }
                );

                var trazabilidad = new InvTrazabilidadProyecto
                {
                    Uuid = Guid.NewGuid().ToString(),
                    IdProyecto = project.IdProyecto,
                    IdUsuario = nuevoDirectorUser.IdUsuario,
                    EstadoAnterior = project.Estado,
                    EstadoNuevo = project.Estado,
                    Observacion = $"Cambio de Dirección: {request.Motivo}. {request.Descripcion}",
                    FechaTransicion = DateTime.Now
                };

                var ultimaTransicion = await _context.InvTrazabilidadProyectos
                    .Where(t => t.IdProyecto == project.IdProyecto)
                    .OrderByDescending(t => t.FechaTransicion)
                    .FirstOrDefaultAsync();

                trazabilidad.HashAnterior = ultimaTransicion?.HashActual;
                string dataToHash = $"{trazabilidad.Uuid}|{trazabilidad.IdProyecto}|{trazabilidad.EstadoNuevo}|{trazabilidad.HashAnterior}|{trazabilidad.FechaTransicion}";
                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dataToHash));
                    trazabilidad.HashActual = Convert.ToHexString(bytes).ToLower();
                }

                _context.InvTrazabilidadProyectos.Add(trazabilidad);

                await _context.SaveChangesAsync();

                ProyectoDto? dto = null;
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    try
                    {
                        var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(project.MetadataCacesJson);
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    }
                    catch { }
                }

                if (dto == null)
                {
                    dto = new ProyectoDto
                    {
                        Uuid = project.Uuid,
                        Titulo = project.Titulo,
                        Estado = project.Estado,
                        CodigoInstitucional = project.CodigoInstitucional
                    };
                }

                var updatedParticipants = await _context.InvProyectoParticipantes
                    .Include(pp => pp.IdUsuarioNavigation)
                    .Where(pp => pp.IdProyecto == project.IdProyecto)
                    .ToListAsync();

                var updatedProfs = updatedParticipants.Where(pp => pp.TipoParticipante == "Docente").ToList();
                var updatedAlums = updatedParticipants.Where(pp => pp.TipoParticipante == "Alumno").ToList();

                var profCedulas = updatedProfs.Select(pp => pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "").Where(c => !string.IsNullOrEmpty(c)).ToList();
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var currentPeriod = await _context.Periodos
                    .Where(p => p.EsInstituto == 1)
                    .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                    .ThenByDescending(p => p.Activo == true)
                    .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                    .ThenByDescending(p => p.FechaInicial)
                    .FirstOrDefaultAsync();
                var periodId = currentPeriod?.IdPeriodo;

                var researchSubcatId = await GetResearchSubcatIdAsync();
                var estadosConCarga = await GetEstadosConCargaHorariaAsync();

                var researchHours = new List<ProfesoresActividade>();
                var otherAssignedHours = new List<InvProyectoParticipante>();
                if (profCedulas.Any() && !string.IsNullOrEmpty(periodId))
                {
                    researchHours = await _context.ProfesoresActividades
                        .Where(pa => profCedulas.Contains(pa.IdProfesor) && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == periodId)
                        .ToListAsync();

                    var profUserIds = updatedProfs.Select(pp => pp.IdUsuario).Distinct().ToList();
                    otherAssignedHours = await _context.InvProyectoParticipantes
                        .Include(pp => pp.IdProyectoNavigation)
                        .Where(pp => pp.TipoParticipante == "Docente" &&
                                     profUserIds.Contains(pp.IdUsuario) &&
                                     pp.IdProyecto != project.IdProyecto &&
                                     pp.Activo != false &&
                                     estadosConCarga.Contains(pp.IdProyectoNavigation!.Estado))
                        .ToListAsync();
                }

                dto.Investigadores = updatedProfs.Select(pp => {
                    var cedula = pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                    var availableHours = researchHours.Where(pa => pa.IdProfesor.Trim() == cedula).Sum(pa => pa.HorasSemana ?? 0);
                    var assignedHours = otherAssignedHours.Where(o => o.IdUsuario == pp.IdUsuario).Sum(o => o.HorasSemanales ?? 0);
                    return new InvestigadorDto
                    {
                        Nombre = pp.IdUsuarioNavigation?.Nombre,
                        Cedula = pp.IdUsuarioNavigation?.IdSigafi,
                        Email = pp.IdUsuarioNavigation?.EmailInstitucional ?? pp.IdUsuarioNavigation?.IdSigafi ?? "",
                        Rol = pp.Rol,
                        NivelAcademico = pp.NivelAcademico,
                        Telefono = pp.Telefono,
                        Activo = pp.Activo ?? true,
                        FechaInicio = pp.FechaInicio,
                        FechaFin = pp.FechaFin,
                        MotivoCambio = pp.MotivoCambio,
                        HorasSemanales = pp.HorasSemanales,
                        HorasDisponibles = availableHours,
                        HorasAsignadas = assignedHours,
                        EsDirector = pp.EsDirector
                    };
                }).Concat(updatedAlums.Select(pa => new InvestigadorDto
                {
                    Nombre = pa.IdUsuarioNavigation?.Nombre,
                    Cedula = pa.IdUsuarioNavigation?.IdSigafi,
                    Email = pa.IdUsuarioNavigation?.EmailInstitucional ?? pa.IdUsuarioNavigation?.IdSigafi ?? "",
                    Rol = pa.Rol,
                    NivelAcademico = pa.NivelAcademico,
                    Telefono = pa.Telefono,
                    Activo = pa.Activo ?? true,
                    FechaInicio = pa.FechaInicio,
                    FechaFin = pa.FechaFin,
                    MotivoCambio = pa.MotivoCambio,
                    HorasSemanales = pa.HorasSemanales,
                    EsDirector = false
                })).ToList();

                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var afterState = new
                {
                    Titulo = project.Titulo,
                    CodigoInstitucional = project.CodigoInstitucional,
                    NuevoDirector = request.NuevoDirectorCedula,
                    Motivo = request.Motivo,
                    Estado = project.Estado
                };
                string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

                await _auditService.LogActionAsync(nuevoDirectorUser.IdUsuario, "TRANSFERIR_DIRECCION", $"Transferencia de dirección del proyecto \"{project.Titulo}\"", "PROYECTOS", beforeJson, afterJson);

                return new SyncResult { Success = true, Uuid = uuid };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al transferir la dirección del proyecto UUID: {Uuid}", uuid);
                return new SyncResult { Success = false, Message = $"Error interno al realizar la transferencia: {ex.Message}" };
            }
        }

        private async Task<InvGrupoInvestigacion?> ResolveApprovedGroupAsync(string? groupUuid)
        {
            if (string.IsNullOrWhiteSpace(groupUuid))
            {
                return null;
            }

            var normalized = groupUuid.Trim();
            if (!Guid.TryParse(normalized, out _))
            {
                return await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g =>
                    g.Nombre.ToLower() == normalized.ToLower() &&
                    g.Activo == true &&
                    g.Estado == "Aprobado");
            }

            return await _context.InvGruposInvestigacion
                .FirstOrDefaultAsync(g => g.Uuid == normalized &&
                g.Activo == true &&
                g.Estado == "Aprobado");
        }

        private async Task<string> GetUserPhoneFromCatalogAsync(string? idSigafi, string? tablaSigafi)
        {
            if (string.IsNullOrEmpty(idSigafi)) return string.Empty;
            var sigafiTrim = idSigafi.Trim();

            if (tablaSigafi == "profesor")
            {
                var prof = await _context.Profesores.FirstOrDefaultAsync(p => p.IdProfesor == sigafiTrim);
                return prof?.Celular ?? prof?.Telefono ?? string.Empty;
            }
            else if (tablaSigafi == "alumno")
            {
                var alum = await _context.Alumnos.FirstOrDefaultAsync(a => a.IdAlumno == sigafiTrim);
                return alum?.Celular ?? alum?.Telefono ?? string.Empty;
            }
            return string.Empty;
        }

        private async Task<string> GetUserEmailFromCatalogAsync(string? idSigafi, string? tablaSigafi)
        {
            if (string.IsNullOrEmpty(idSigafi)) return string.Empty;
            var sigafiTrim = idSigafi.Trim();

            if (tablaSigafi == "profesor")
            {
                var prof = await _context.Profesores.FirstOrDefaultAsync(p => p.IdProfesor == sigafiTrim);
                return prof != null ? (prof.EmailInstitucional ?? prof.Email ?? string.Empty) : string.Empty;
            }
            else if (tablaSigafi == "alumno")
            {
                var alum = await _context.Alumnos.FirstOrDefaultAsync(a => a.IdAlumno == sigafiTrim);
                return alum != null ? (alum.EmailInstitucional ?? alum.Email ?? string.Empty) : string.Empty;
            }
            return string.Empty;
        }

        private async Task<List<InvestigadorDto>> BuildProjectInvestigadoresFromGroupAsync(int groupId, int projectId, List<InvestigadorDto>? incomingInvestigadores = null)
        {
            var groupMembers = await _context.InvGruposMiembros
                .Include(m => m.IdUsuarioNavigation)
                .Where(m => m.IdGrupo == groupId && m.Activo != false && m.IdUsuarioNavigation != null && !string.IsNullOrEmpty(m.IdUsuarioNavigation.IdSigafi))
                .ToListAsync();

            var group = await _context.InvGruposInvestigacion
                .Include(g => g.IdCoordinadorNavigation)
                .FirstOrDefaultAsync(g => g.IdGrupo == groupId);

            var participantes = new List<InvestigadorDto>();

            // 1. Aprovisionar y añadir al Coordinador de Grupo como Coordinador de Proyecto (si es docente)
            if (group?.IdCoordinadorNavigation != null && !string.IsNullOrEmpty(group.IdCoordinadorNavigation.IdSigafi))
            {
                var coordSigafi = group.IdCoordinadorNavigation.IdSigafi.Trim();
                var phone = await GetUserPhoneFromCatalogAsync(coordSigafi, group.IdCoordinadorNavigation.TablaSigafi);
                
                decimal? coordHours = 0;
                var coordIncoming = incomingInvestigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == coordSigafi);
                if (coordIncoming != null)
                {
                    coordHours = coordIncoming.HorasSemanales;
                }

                participantes.Add(new InvestigadorDto
                {
                    Nombre = group.IdCoordinadorNavigation.Nombre,
                    Cedula = coordSigafi,
                    Email = group.IdCoordinadorNavigation.EmailInstitucional ?? group.IdCoordinadorNavigation.IdSigafi ?? "",
                    Rol = "Coordinador de Proyecto",
                    NivelAcademico = "Tercer Nivel",
                    Telefono = phone,
                    Activo = true,
                    HorasSemanales = coordHours,
                    FechaInicio = DateTime.Now,
                    EsDirector = false
                });
            }

            // 2. Aprovisionar y añadir al resto de miembros activos del grupo
            foreach (var m in groupMembers)
            {
                var user = m.IdUsuarioNavigation!;
                var sigafiId = user.IdSigafi!.Trim();

                if (participantes.Any(p => p.Cedula == sigafiId)) continue; // ya se añadió (ej: si el coordinador también está en la lista de miembros)

                var phone = await GetUserPhoneFromCatalogAsync(sigafiId, user.TablaSigafi);
                decimal? memberHours = 0;
                var memberIncoming = incomingInvestigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == sigafiId);
                if (memberIncoming != null)
                {
                    memberHours = memberIncoming.HorasSemanales;
                }

                participantes.Add(new InvestigadorDto
                {
                    Nombre = user.Nombre,
                    Cedula = sigafiId,
                    Email = user.EmailInstitucional ?? user.IdSigafi ?? "",
                    Rol = m.Rol ?? "Co-Investigador",
                    NivelAcademico = user.TablaSigafi == "alumno" ? "Pregrado" : "Tercer Nivel",
                    Telefono = phone,
                    Activo = true,
                    HorasSemanales = memberHours,
                    FechaInicio = DateTime.Now,
                    EsDirector = false
                });
            }

            // 3. Sincronizar teléfonos e información de contacto desde el distributivo de personal si fallan
            foreach (var p in participantes)
            {
                if (string.IsNullOrWhiteSpace(p.Cedula)) continue;
                var phone = await GetUserPhoneFromCatalogAsync(p.Cedula, p.NivelAcademico == "Pregrado" ? "alumno" : "profesor");
                if (!string.IsNullOrEmpty(phone))
                {
                    p.Telefono = phone;
                }
                p.Carrera = null;
            }

            return participantes
                .Where(i => !string.IsNullOrWhiteSpace(i.Cedula))
                .GroupBy(i => i.Cedula!.Trim())
                .ToDictionary(g => g.Key, g => g.First())
                .Values.ToList();
        }
    }
}
