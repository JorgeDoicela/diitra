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
    public partial class ProjectOrchestrator : IProjectOrchestrator
    {
        public async Task<bool> UserCanModifyProjectAsync(string projectUuid, string userSigafiId)
        {
            if (await IsSystemAdminAsync(userSigafiId)) return true;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null) return true;

            // Si el proyecto ya fue enviado o aprobado, está blindado para el usuario regular
            if (project.Estado != "Borrador" && project.Estado != "En Corrección" && project.Estado != "Prepropuesta" && project.Estado != "Prepropuesta Rechazada")
            {
                return false;
            }

            if (project.TieneGrupo == true && project.IdGrupo.HasValue)
            {
                var isGroupMember = await _context.InvGruposMiembros
                    .AnyAsync(m => m.IdGrupo == project.IdGrupo.Value && m.IdUsuario == user.IdUsuario && m.Activo != false);
                if (isGroupMember) return true;
            }

            return await _context.InvProyectoParticipantes.AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == user.IdUsuario && pp.Activo != false);
        }

        public async Task<bool> UserCanViewProjectAsync(string projectUuid, string userSigafiId)
        {
            if (await IsSystemAdminAsync(userSigafiId)) return true;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null) return true;

            // 1. Verificar si es integrante directo del equipo del proyecto
            var isTeamMember = await _context.InvProyectoParticipantes.AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == user.IdUsuario && pp.Activo != false);
            if (isTeamMember) return true;

            // 2. Verificar si es miembro del grupo de investigación asociado al proyecto
            if (project.TieneGrupo == true && project.IdGrupo.HasValue)
            {
                var isGroupMember = await _context.InvGruposMiembros
                    .AnyAsync(m => m.IdGrupo == project.IdGrupo.Value && m.IdUsuario == user.IdUsuario && m.Activo != false);
                if (isGroupMember) return true;
            }

            // 3. Verificar si es un Revisor por Pares asignado a este proyecto
            var isPeerReviewer = await _context.InvRevisionesPares
                .AnyAsync(r => r.IdProyecto == project.IdProyecto && r.IdRevisor == user.IdUsuario);
            if (isPeerReviewer) return true;

            return false;
        }

        public async Task<bool> IsSystemAdminAsync(string userSigafiId)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            if (user.Administrador) return true;

            var adminRoles = new[] { "DIITRA_ADMIN" };
            return await _context.UserRoles.AsNoTracking()
                .AnyAsync(ur => ur.IdUsuario == user.IdUsuario
                    && (ur.EsActivo ?? true)
                    && adminRoles.Contains(ur.Role.CodigoRol));
        }

        public async Task<int?> GetUserInternalIdBySigafiIdAsync(string sigafiId)
        {
            if (string.IsNullOrWhiteSpace(sigafiId)) return null;
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == sigafiId);
            return user?.IdUsuario;
        }

        public async Task<bool> IsProjectDirectorAsync(string projectUuid, string userSigafiId)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.AsNoTracking().FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null) return false;

            return await _context.InvProyectoParticipantes.AsNoTracking().AnyAsync(pp =>
                pp.IdProyecto == project.IdProyecto &&
                pp.IdUsuario == user.IdUsuario &&
                pp.EsDirector == true &&
                pp.TipoParticipante == "Docente" &&
                pp.Activo != false);
        }

        public async Task<bool> UserCanRequestTeamChangeAsync(string projectUuid, string userSigafiId)
        {
            if (await IsSystemAdminAsync(userSigafiId)) return true;

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.AsNoTracking().FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null) return false;

            if (project.Estado is "Finalizado" or "Rechazado") return false;

            if (await IsProjectDirectorAsync(projectUuid, userSigafiId)) return true;

            var isProjectTeamMember = await _context.InvProyectoParticipantes.AsNoTracking()
                    .AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == user.IdUsuario && pp.Activo != false);
            if (isProjectTeamMember) return true;

            if (project.TieneGrupo == true && project.IdGrupo.HasValue)
            {
                var group = await _context.InvGruposInvestigacion.AsNoTracking()
                    .Include(g => g.IdCoordinadorNavigation)
                    .FirstOrDefaultAsync(g => g.IdGrupo == project.IdGrupo.Value);
                if (group != null)
                {
                    if (group.IdCoordinador == user.IdUsuario) return true;

                    var coordinatorSigafi = group.IdCoordinadorNavigation?.IdSigafi?.Trim();
                    if (!string.IsNullOrEmpty(coordinatorSigafi) &&
                        string.Equals(coordinatorSigafi, userSigafiId.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    return await _context.InvGruposMiembros.AsNoTracking()
                        .AnyAsync(m => m.IdGrupo == group.IdGrupo && m.IdUsuario == user.IdUsuario && m.Activo != false);
                }
            }

            return false;
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
    }
}
