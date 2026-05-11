using Microsoft.EntityFrameworkCore;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.Security;

public class AdminService : IAdminService
{
    private readonly DiitraContext _context;

    public AdminService(DiitraContext context)
    {
        _context = context;
    }

    public async Task<List<UserManagementDto>> GetUsersAsync(string? searchTerm, string type = "DOCENTE")
    {
        searchTerm = searchTerm?.ToLower() ?? "";

        // Obtener periodo académico activo (usado para alumnos y docentes)
        var currentPeriod = await _context.Periodos
            .OrderByDescending(p => p.Periodoactivoinstituto)
            .ThenByDescending(p => p.FechaInicial)
            .FirstOrDefaultAsync(p => p.Periodoactivoinstituto == 1 || p.Activo == true);
        var periodId = currentPeriod?.IdPeriodo;

        if (type == "ESTUDIANTE")
        {
            var studentQuery = _context.Alumnos.AsQueryable();

            // Solo alumnos con matrícula válida en el periodo actual que no se hayan retirado
            if (!string.IsNullOrEmpty(periodId))
            {
                studentQuery = studentQuery.Where(a => _context.Matriculas.Any(m => 
                    m.IdAlumno == a.IdAlumno && 
                    m.IdPeriodo == periodId && 
                    (m.Retirado == null || m.Retirado == false) && 
                    (m.Valida == 1)));
            }
            if (!string.IsNullOrEmpty(searchTerm))
            {
                studentQuery = studentQuery.Where(a =>
                    (a.IdAlumno != null && a.IdAlumno.Contains(searchTerm)) ||
                    (a.PrimerNombre != null && a.PrimerNombre.ToLower().Contains(searchTerm)) ||
                    (a.ApellidoPaterno != null && a.ApellidoPaterno.ToLower().Contains(searchTerm)));
            }

            var students = await studentQuery.OrderBy(s => s.IdAlumno).Take(20).ToListAsync();
            var ids = students.Select(s => s.IdAlumno.Trim()).ToList();

            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Where(ur => ur.User != null && ids.Contains(ur.User.IdSigafi) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .ToListAsync();

            var userIds = userRoles.Where(ur => ur.User != null).Select(ur => ur.User.IdUsuario).Distinct().ToList();
            var metadatas = await _context.InvUsuariosMetadata.Where(m => userIds.Contains(m.IdUsuario)).ToListAsync();

            return students.Select(s => {
                var roleInfo = userRoles.Where(ur => ur.User != null && ur.User.IdSigafi.Trim() == s.IdAlumno.Trim()).ToList();
                var firstUserId = roleInfo.FirstOrDefault()?.User?.IdUsuario;
                var userMeta = firstUserId.HasValue ? metadatas.FirstOrDefault(m => m.IdUsuario == firstUserId.Value) : null;

                return new UserManagementDto
                {
                    IdProfesor = s.IdAlumno.Trim(),
                    NombreCompleto = $"{s.PrimerNombre} {s.ApellidoPaterno}",
                    Email = s.EmailInstitucional ?? s.Email ?? "",
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "ESTUDIANTE",
                    Roles = roleInfo.Select(ur => ur.Role.Nombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.Role.CodigoRol).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.FirmaHabilitada ?? false
                };
            }).ToList();
        }
        else if (type == "EXTERNO")
        {
             var userQuery = _context.Users
                .Where(u => u.TablaSigafi == "otros" || u.TablaSigafi == null)
                .Where(u => _context.InvUsuariosMetadata.Any(m => m.IdUsuario == u.IdUsuario));
             if (!string.IsNullOrEmpty(searchTerm))
             {
                 userQuery = userQuery.Where(u => u.IdSigafi.Contains(searchTerm) || u.Nombre.ToLower().Contains(searchTerm));
             }

             var externalUsers = await userQuery.OrderBy(u => u.IdUsuario).Take(20).ToListAsync();
             var ids = externalUsers.Select(u => u.IdUsuario).ToList();

             var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ids.Contains(ur.IdUsuario) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .ToListAsync();

             var metadatas = await _context.InvUsuariosMetadata.Where(m => ids.Contains(m.IdUsuario)).ToListAsync();

             return externalUsers.Select(u => {
                 var roleInfo = userRoles.Where(ur => ur.IdUsuario == u.IdUsuario).ToList();
                 var userMeta = metadatas.FirstOrDefault(m => m.IdUsuario == u.IdUsuario);

                 return new UserManagementDto
                 {
                     IdProfesor = u.IdSigafi,
                     NombreCompleto = u.Nombre,
                     Email = u.IdSigafi.Contains("@") ? u.IdSigafi : "externo@diitra.ist",
                     UserUuid = userMeta?.Uuid.ToString() ?? "",
                     Type = "EXTERNO",
                     Roles = roleInfo.Select(ur => ur.Role.Nombre).ToList(),
                     RoleCodes = roleInfo.Select(ur => ur.Role.CodigoRol).ToList(),
                     OrcidId = userMeta?.OrcidId,
                     FirmaHabilitada = userMeta?.FirmaHabilitada ?? false
                 };
             }).ToList();
        }
        else
        {
            var professorQuery = _context.Profesores.Where(p => p.Activo == 1);
            if (!string.IsNullOrEmpty(searchTerm))
            {
                professorQuery = professorQuery.Where(p =>
                    (p.IdProfesor != null && p.IdProfesor.Contains(searchTerm)) ||
                    (p.PrimerNombre != null && p.PrimerNombre.ToLower().Contains(searchTerm)) ||
                    (p.PrimerApellido != null && p.PrimerApellido.ToLower().Contains(searchTerm)));
            }

            var professors = await professorQuery.OrderBy(p => p.IdProfesor).Take(20).ToListAsync();
            var ids = professors.Select(p => p.IdProfesor.Trim()).ToList();

            // Obtener horas de investigación (idSubcategoria = 7)
            var researchHours = await _context.ProfesoresActividades
                .Where(pa => ids.Contains(pa.IdProfesor) && pa.IdSubcategoria == 7 && pa.IdPeriodo == periodId)
                .ToListAsync();

            // Obtener dedicación desde la tabla de contratos activos
            var activeContracts = await _context.Contratos
                .Include(c => c.TipoContratoNavigation)
                .Where(c => ids.Contains(c.IdProfesor) && c.EsActivo == 1)
                .ToListAsync();

            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Where(ur => ur.User != null && ids.Contains(ur.User.IdSigafi) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .ToListAsync();

            var userIds = userRoles.Where(ur => ur.User != null).Select(ur => ur.User.IdUsuario).Distinct().ToList();
            var metadatas = await _context.InvUsuariosMetadata.Where(m => userIds.Contains(m.IdUsuario)).ToListAsync();

            return professors.Select(p => {
                var roleInfo = userRoles.Where(ur => ur.User != null && ur.User.IdSigafi.Trim() == p.IdProfesor.Trim()).ToList();
                var firstUserId = roleInfo.FirstOrDefault()?.User?.IdUsuario;
                var userMeta = firstUserId.HasValue ? metadatas.FirstOrDefault(m => m.IdUsuario == firstUserId.Value) : null;

                var hours = researchHours.FirstOrDefault(rh => rh.IdProfesor == p.IdProfesor.Trim())?.HorasSemana;
                var contract = activeContracts.FirstOrDefault(c => c.IdProfesor == p.IdProfesor.Trim());
                var dedName = contract?.TipoContratoNavigation?.Nombre ?? "Sin contrato";

                return new UserManagementDto
                {
                    IdProfesor = p.IdProfesor.Trim(),
                    NombreCompleto = $"{p.PrimerNombre} {p.PrimerApellido}",
                    Email = p.EmailInstitucional ?? p.Email ?? "",
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "DOCENTE",
                    Roles = roleInfo.Select(ur => ur.Role.Nombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.Role.CodigoRol).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.FirmaHabilitada ?? false,
                    HorasInvestigacion = hours,
                    TipoDedicacion = dedName
                };
            }).ToList();
        }
    }

    public async Task<List<RoleDto>> GetAvailableRolesAsync()
    {
        return await _context.Roles
            .Where(r => r.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
            .Select(r => new RoleDto {
                IdRol = r.IdRol,
                Nombre = r.Nombre,
                CodigoRol = r.CodigoRol
            })
            .ToListAsync();
    }

    public async Task<UserMetadataDto?> GetUserMetadataAsync(string userUuid)
    {
        var meta = await _context.InvUsuariosMetadata
            .FirstOrDefaultAsync(m => m.Uuid.ToString() == userUuid);

        if (meta == null) return null;

        return new UserMetadataDto {
            OrcidId = meta.OrcidId,
            ScopusId = meta.ScopusId,
            GoogleScholarUrl = meta.GoogleScholarUrl,
            ResearchGateUrl = meta.ResearchGateUrl,
            Especialidad = meta.Especialidad,
            GradoAcademicoMaximo = meta.GradoAcademicoMaximo
        };
    }

    public async Task<bool> UpdateUserMetadataAsync(string userUuid, UserMetadataDto dto, string? adminUsername = null)
    {
        var meta = await _context.InvUsuariosMetadata.Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Uuid.ToString() == userUuid);

        if (meta == null) return false;

        meta.OrcidId = dto.OrcidId;
        meta.ScopusId = dto.ScopusId;
        meta.GoogleScholarUrl = dto.GoogleScholarUrl;
        meta.ResearchGateUrl = dto.ResearchGateUrl;
        meta.Especialidad = dto.Especialidad;
        meta.GradoAcademicoMaximo = dto.GradoAcademicoMaximo;
        meta.Version++;

        await _context.SaveChangesAsync();
        await AddAuditLogAsync(adminUsername, meta.IdUsuario, "ACTUALIZAR_METADATA", $"Actualización de perfil científico y académico.");

        return true;
    }

    public async Task<bool> AssignRoleAsync(string idUsuario, string roleCode, string userType = "DOCENTE", string? adminUsername = null)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == roleCode || r.Nombre == roleCode);
        if (role == null)
        {
            role = new Role
            {
                CodigoRol = roleCode,
                Nombre = roleCode == "DIITRA_ADMIN" ? "Administrador DIITRA" :
                         roleCode == "DIITRA_DOCENTE" ? "Docente Investigador DIITRA" :
                         roleCode == "DIITRA_ESTUDIANTE" ? "Estudiante DIITRA" : roleCode,
                EsActivo = true
            };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idUsuario);
        if (user == null)
        {
            if (userType == "DIITRA_ESTUDIANTE" || userType == "ESTUDIANTE")
            {
                var s = await _context.Alumnos.FirstOrDefaultAsync(a => a.IdAlumno == idUsuario);
                if (s == null) return false;
                string fullNombre = $"{s.PrimerNombre} {s.SegundoNombre} {s.ApellidoPaterno} {s.ApellidoMaterno}".Replace("  ", " ").Trim();
                user = new User {
                    IdSigafi = idUsuario,
                    Nombre = fullNombre,
                    Contrasenia = BCrypt.Net.BCrypt.HashPassword(s.Password ?? "cambiame"),
                    Activo = true,
                    TablaSigafi = "alumno"
                };
            }
            else
            {
                var p = await _context.Profesores.FirstOrDefaultAsync(prof => prof.IdProfesor == idUsuario);
                if (p == null) return false;
                string fullNombre = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim();
                user = new User {
                    IdSigafi = idUsuario,
                    Nombre = fullNombre,
                    Contrasenia = BCrypt.Net.BCrypt.HashPassword(p.Clave ?? "cambiame"),
                    Activo = true,
                    TablaSigafi = "profesor"
                };
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _context.InvUsuariosMetadata.Add(new InvUsuarioMetadata { IdUsuario = user.IdUsuario, Uuid = Guid.NewGuid(), Version = 1 });
            await _context.SaveChangesAsync();
        }

        var existing = await _context.UserRoles.FirstOrDefaultAsync(ur => ur.IdUsuario == user.IdUsuario && ur.IdRol == role.IdRol);
        if (existing != null) {
            existing.EsActivo = true;
            existing.FechaModificacion = DateOnly.FromDateTime(DateTime.UtcNow);
        } else {
            _context.UserRoles.Add(new UserRole { IdUsuario = user.IdUsuario, IdRol = role.IdRol, EsActivo = true, FechaCreacion = DateOnly.FromDateTime(DateTime.UtcNow) });
        }

        await _context.SaveChangesAsync();
        await AddAuditLogAsync(adminUsername, user.IdUsuario, "ASIGNAR_ROL", $"Asignación del rol {role.Nombre}");

        return true;
    }

    public async Task<bool> RevokeRoleAsync(string idUsuario, string roleCode, string userType = "DOCENTE", string? adminUsername = null)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == roleCode || r.Nombre == roleCode);
        if (role == null) return false;

        var existing = await _context.UserRoles
            .Include(ur => ur.User)
            .FirstOrDefaultAsync(ur => ur.User.IdSigafi == idUsuario && ur.IdRol == role.IdRol);

        if (existing != null)
        {
            existing.EsActivo = false;
            existing.FechaModificacion = DateOnly.FromDateTime(DateTime.UtcNow);
            await _context.SaveChangesAsync();
            await AddAuditLogAsync(adminUsername, existing.IdUsuario, "REVOCAR_ROL", $"Revocación del rol {role.Nombre}");
        }

        return true;
    }

    public async Task<bool> RegisterExternalUserAsync(ExternalUserDto dto, string? adminUsername = null)
    {
        var existing = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == dto.Cedula || u.IdSigafi == dto.Email);
        if (existing != null) return false;

        var user = new User {
            IdSigafi = dto.Cedula,
            Nombre = dto.FullName,
            Contrasenia = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString().Substring(0, 8)), // Temporal
            Activo = true,
            TablaSigafi = "otros"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _context.InvUsuariosMetadata.Add(new InvUsuarioMetadata { IdUsuario = user.IdUsuario, Uuid = Guid.NewGuid(), Version = 1 });
        await _context.SaveChangesAsync();

        // Asignar rol por defecto
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == dto.DefaultRole);
        if (role == null)
        {
            role = new Role { CodigoRol = dto.DefaultRole, Nombre = dto.DefaultRole, EsActivo = true };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        _context.UserRoles.Add(new UserRole { IdUsuario = user.IdUsuario, IdRol = role.IdRol, EsActivo = true, FechaCreacion = DateOnly.FromDateTime(DateTime.UtcNow) });
        await _context.SaveChangesAsync();

        await AddAuditLogAsync(adminUsername, user.IdUsuario, "REGISTRO_EXTERNO", $"Registro manual de evaluador externo.");
        return true;
    }

    public async Task<List<AuditLogDto>> GetRecentAuditLogsAsync()
    {
        return await _context.Set<InvAuditAdmin>()
            .Include(a => a.UserAdmin)
            .Include(a => a.UserAfectado)
            .OrderByDescending(a => a.Fecha)
            .Take(50)
            .Select(a => new AuditLogDto {
                IdAudit = a.IdAudit,
                AdminName = a.UserAdmin.Nombre,
                TargetName = a.UserAfectado.Nombre,
                Action = a.Accion,
                Details = a.Detalle,
                Date = a.Fecha
            })
            .ToListAsync();
    }

    private async Task AddAuditLogAsync(string? adminUsername, int affectedUserId, string action, string details)
    {
        if (string.IsNullOrEmpty(adminUsername)) return;

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == adminUsername);
        if (admin == null) return;

        var audit = new InvAuditAdmin {
            IdUsuarioAdmin = admin.IdUsuario,
            IdUsuarioAfectado = affectedUserId,
            Accion = action,
            Detalle = details,
            Fecha = DateTime.UtcNow
        };

        _context.Set<InvAuditAdmin>().Add(audit);
        await _context.SaveChangesAsync();
    }
}
