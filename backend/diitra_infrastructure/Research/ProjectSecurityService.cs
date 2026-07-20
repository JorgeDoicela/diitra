using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research
{
    public class ProjectSecurityService : IProjectSecurityService
    {
        private readonly DiitraContext _context;
        private readonly IProjectQueryService _queryService;

        public ProjectSecurityService(DiitraContext context, IProjectQueryService queryService)
        {
            _context = context;
            _queryService = queryService;
        }

        public async Task<bool> UserCanModifyProjectAsync(string projectUuid, string userSigafiId)
        {
            if (await IsSystemAdminAsync(userSigafiId)) return true;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            var canonicalUuid = await _queryService.ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
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

            var canonicalUuid = await _queryService.ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
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

            var canonicalUuid = await _queryService.ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
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

            var canonicalUuid = await _queryService.ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
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
    }
}
