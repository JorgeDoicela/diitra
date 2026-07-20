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
    public class ProjectTeamSyncService : IProjectTeamSyncService
    {
        private readonly DiitraContext _context;
        private readonly IAuthService _authService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ProjectTeamSyncService> _logger;

        public ProjectTeamSyncService(
            DiitraContext context,
            IAuthService authService,
            INotificationService notificationService,
            ILogger<ProjectTeamSyncService> logger)
        {
            _context = context;
            _authService = authService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<InvGrupoInvestigacion?> ResolveApprovedGroupAsync(string? groupUuid)
        {
            return await ProjectHelper.ResolveApprovedGroupAsync(_context, groupUuid);
        }

        public async Task SyncInvestigadoresAsync(int projectId, List<InvestigadorDto>? investigadores, bool isFromWizard = false)
        {
            if (investigadores == null) return;

            var currentParticipants = await _context.InvProyectoParticipantes
                .Include(pp => pp.IdUsuarioNavigation)
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            var currentProfs = currentParticipants.Where(pp => pp.TipoParticipante == "Docente").ToList();
            var currentAlums = currentParticipants.Where(pp => pp.TipoParticipante == "Alumno").ToList();

            var activeCedulas = investigadores
                .Where(i => !string.IsNullOrEmpty(i.Cedula) && i.Activo != false)
                .Select(i => i.Cedula!.Trim())
                .ToHashSet();

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
                            string newRol = ProjectHelper.NormalizeRole(inv.Rol);

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
                            Rol = ProjectHelper.NormalizeRole(inv.Rol),
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = !string.IsNullOrEmpty(inv.Telefono) ? inv.Telefono : await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, persona.IdSigafi, persona.TablaSigafi),
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
                            string newRol = ProjectHelper.NormalizeRole(inv.Rol);

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
                            Rol = ProjectHelper.NormalizeRole(inv.Rol),
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = !string.IsNullOrEmpty(inv.Telefono) ? inv.Telefono : await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, persona.IdSigafi, persona.TablaSigafi),
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

        public async Task<List<InvestigadorDto>> BuildProjectInvestigadoresFromGroupAsync(int groupId, int projectId, List<InvestigadorDto>? incomingInvestigadores = null)
        {
            var groupMembers = await _context.InvGruposMiembros
                .Include(m => m.IdUsuarioNavigation)
                .Where(m => m.IdGrupo == groupId && m.Activo != false && m.IdUsuarioNavigation != null && !string.IsNullOrEmpty(m.IdUsuarioNavigation.IdSigafi))
                .ToListAsync();

            var group = await _context.InvGruposInvestigacion
                .Include(g => g.IdCoordinadorNavigation)
                .FirstOrDefaultAsync(g => g.IdGrupo == groupId);

            var participantes = new List<InvestigadorDto>();

            if (group?.IdCoordinadorNavigation != null && !string.IsNullOrEmpty(group.IdCoordinadorNavigation.IdSigafi))
            {
                var coordSigafi = group.IdCoordinadorNavigation.IdSigafi.Trim();
                var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, coordSigafi, group.IdCoordinadorNavigation.TablaSigafi);
                
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

            foreach (var m in groupMembers)
            {
                var user = m.IdUsuarioNavigation!;
                var sigafiId = user.IdSigafi!.Trim();

                if (participantes.Any(p => p.Cedula == sigafiId)) continue;

                var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, sigafiId, user.TablaSigafi);
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

            foreach (var p in participantes)
            {
                if (string.IsNullOrWhiteSpace(p.Cedula)) continue;
                var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, p.Cedula, p.NivelAcademico == "Pregrado" ? "alumno" : "profesor");
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

        public async Task SyncProjectCarrerasAsync(int projectId, int? idCarreraPrincipal, List<InvestigadorDto>? investigadores)
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

        public async Task<int> GetResearchSubcatIdAsync()
        {
            var researchSubcatId = await _context.SubcategoriasActividades
                .Where(s => s.Subcategoria == "INVESTIGACION")
                .Select(s => s.IdSubcategoria)
                .FirstOrDefaultAsync();
            if (researchSubcatId == 0) researchSubcatId = 7;
            return researchSubcatId;
        }

        public async Task<List<string>> GetEstadosConCargaHorariaAsync()
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
    }
}
