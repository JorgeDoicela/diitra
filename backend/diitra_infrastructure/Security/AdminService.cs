using Microsoft.EntityFrameworkCore;
using System.Linq;
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

    public async Task<PagedResult<UserManagementDto>> GetUsersAsync(string? searchTerm, string type = "DOCENTE", int page = 1, int pageSize = 10)
    {
        searchTerm = searchTerm?.ToLower() ?? "";
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        // Obtener periodo académico (Lógica Resiliente de Descubrimiento)
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentPeriod = await _context.Periodos
            .OrderByDescending(p => p.Periodoactivoinstituto == 1) // 1. Marcado explícitamente para el sistema
            .ThenByDescending(p => p.Activo == true)             // 2. Marcado como activo genérico
            .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today) // 3. El que cubre la fecha de hoy
            .ThenByDescending(p => p.FechaInicial)               // 4. El más reciente cronológicamente
            .FirstOrDefaultAsync();

        var periodId = currentPeriod?.IdPeriodo;

        var result = new PagedResult<UserManagementDto>
        {
            PageNumber = page,
            PageSize = pageSize
        };

        if (type == "ESTUDIANTE")
        {
            var query = _context.Alumnos.AsQueryable();

            // Solo alumnos con matrícula válida en el periodo actual que no se hayan retirado
            if (!string.IsNullOrEmpty(periodId))
            {
                query = query.Where(a => _context.Matriculas.Any(m =>
                    m.IdAlumno == a.IdAlumno &&
                    m.IdPeriodo == periodId &&
                    (m.Retirado == null || m.Retirado == false) &&
                    (m.Valida == 1)));
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(a =>
                    (a.IdAlumno != null && a.IdAlumno.Contains(searchTerm)) ||
                    (a.PrimerNombre != null && a.PrimerNombre.ToLower().Contains(searchTerm)) ||
                    (a.ApellidoPaterno != null && a.ApellidoPaterno.ToLower().Contains(searchTerm)));
            }

            result.TotalCount = await query.CountAsync();

            var students = await query
                .OrderBy(a => a.ApellidoPaterno)
                .ThenBy(a => a.PrimerNombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ids = students.Select(s => s.IdAlumno.Trim()).ToList();

            // Obtener datos académicos extra (Matrícula actual para Nivel y Carrera)
            var currentMatriculas = await _context.Matriculas
                .Where(m => ids.Contains(m.IdAlumno) && m.IdPeriodo == periodId && m.Valida == 1)
                .ToListAsync();

            var careers = await _context.Carreras.ToListAsync();

            // Pre-cargar información de Cursos (Niveles/Carreras operativos)
            var levelIds = currentMatriculas.Select(m => (int?)m.IdNivel)
                .Concat(students.Select(s => s.IdNivel))
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();
            var relevantCursos = await _context.Cursos.Where(c => levelIds.Contains(c.IdNivel)).ToListAsync();

            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Where(ur => ur.User != null && ids.Contains(ur.User.IdSigafi) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .ToListAsync();

            var userIds = userRoles.Where(ur => ur.User != null).Select(ur => ur.User.IdUsuario).Distinct().ToList();
            var metadatas = await _context.InvUsuariosMetadata.Where(m => userIds.Contains(m.IdUsuario)).ToListAsync();

            result.Items = students.Select(s => {
                var sId = s.IdAlumno.Trim();
                var roleInfo = userRoles.Where(ur => ur.User != null && ur.User.IdSigafi.Trim() == sId).ToList();
                var firstUserId = roleInfo.FirstOrDefault()?.User?.IdUsuario;
                var userMeta = firstUserId.HasValue ? metadatas.FirstOrDefault(m => m.IdUsuario == firstUserId.Value) : null;

                var matricula = currentMatriculas.FirstOrDefault(m => m.IdAlumno.Trim() == sId);

                // Lógica de descubrimiento de datos académicos vía tabla 'cursos'
                // Esta es la forma real en que SIGAFI vincula alumnos con carreras y niveles operativos
                var idNivelTarget = matricula?.IdNivel ?? s.IdNivel;
                var cursoInfo = relevantCursos.FirstOrDefault(c => c.IdNivel == idNivelTarget);

                var carreraNom = careers.FirstOrDefault(c => c.IdCarrera == cursoInfo?.IdCarrera)?.Carrera1;
                var nivelNom = cursoInfo?.Nivel;

                return new UserManagementDto
                {
                    IdProfesor = sId,
                    NombreCompleto = $"{s.PrimerNombre} {s.SegundoNombre} {s.ApellidoPaterno} {s.ApellidoMaterno}".Replace("  ", " ").Trim(),
                    Email = s.EmailInstitucional ?? s.Email ?? "",
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "ESTUDIANTE",
                    Roles = roleInfo.Select(ur => ur.Role.Nombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.Role.CodigoRol).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.FirmaHabilitada ?? false,
                    Carrera = carreraNom ?? "No vinculada",
                    Nivel = nivelNom ?? "N/A"
                };
            }).ToList();
        }
        else if (type == "EXTERNO")
        {
            var query = _context.Users
                .Where(u => u.TablaSigafi == "otros" || u.TablaSigafi == null)
                .Where(u => _context.InvUsuariosMetadata.Any(m => m.IdUsuario == u.IdUsuario));

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(u => u.IdSigafi.Contains(searchTerm) || (u.Nombre != null && u.Nombre.ToLower().Contains(searchTerm)));
            }

            result.TotalCount = await query.CountAsync();

            var externalUsers = await query
                .OrderBy(u => u.Nombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ids = externalUsers.Select(u => u.IdUsuario).ToList();

            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ids.Contains(ur.IdUsuario) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .ToListAsync();

            var metadatas = await _context.InvUsuariosMetadata.Where(m => ids.Contains(m.IdUsuario)).ToListAsync();

            // Pre-cargar posibles nombres de fallback desde profesores/alumnos
            var externalIds = externalUsers.Select(u => u.IdSigafi.Trim()).ToList();
            var fallbackProfs = await _context.Profesores.Where(p => externalIds.Contains(p.IdProfesor.Trim())).ToListAsync();
            var fallbackStudents = await _context.Alumnos.Where(a => externalIds.Contains(a.IdAlumno.Trim())).ToListAsync();

            result.Items = externalUsers.Select(u => {
                var sId = u.IdSigafi.Trim();
                var roleInfo = userRoles.Where(ur => ur.IdUsuario == u.IdUsuario).ToList();
                var userMeta = metadatas.FirstOrDefault(m => m.IdUsuario == u.IdUsuario);

                // Intentar obtener nombre completo desde tablas base si existe vínculo
                var prof = fallbackProfs.FirstOrDefault(p => p.IdProfesor.Trim() == sId);
                var student = fallbackStudents.FirstOrDefault(a => a.IdAlumno.Trim() == sId);
                
                string nombreCompleto = u.Nombre ?? "";
                if (prof != null) {
                    nombreCompleto = $"{prof.PrimerNombre} {prof.SegundoNombre} {prof.PrimerApellido} {prof.SegundoApellido}".Replace("  ", " ").Trim();
                } else if (student != null) {
                    nombreCompleto = $"{student.PrimerNombre} {student.SegundoNombre} {student.ApellidoPaterno} {student.ApellidoMaterno}".Replace("  ", " ").Trim();
                }

                return new UserManagementDto
                {
                    IdProfesor = sId,
                    NombreCompleto = nombreCompleto,
                    Email = u.IdSigafi.Contains("@") ? u.IdSigafi : (u.EmailInstitucional ?? "externo@diitra.ist"),
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "EXTERNO",
                    Roles = roleInfo.Select(ur => ur.Role.Nombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.Role.CodigoRol).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.FirmaHabilitada ?? false
                };
            }).ToList();
        }
        else // DOCENTE
        {
            var query = _context.Profesores.Where(p => p.Activo == 1);

            // Solo docentes que tengan actividades de investigación (idSubcategoria = 7) en el periodo actual
            if (!string.IsNullOrEmpty(periodId))
            {
                query = query.Where(p => _context.ProfesoresActividades.Any(pa =>
                    pa.IdProfesor == p.IdProfesor &&
                    pa.IdSubcategoria == 7 &&
                    pa.IdPeriodo == periodId));
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(p =>
                    (p.IdProfesor != null && p.IdProfesor.Contains(searchTerm)) ||
                    (p.PrimerNombre != null && p.PrimerNombre.ToLower().Contains(searchTerm)) ||
                    (p.PrimerApellido != null && p.PrimerApellido.ToLower().Contains(searchTerm)));
            }

            result.TotalCount = await query.CountAsync();

            var professors = await query
                .OrderBy(p => p.PrimerApellido)
                .ThenBy(p => p.PrimerNombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

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

            var careers = await _context.Carreras.ToListAsync();

            // Obtener carreras vinculadas a los docentes en este periodo
            var profCareers = await _context.ProfesoresCarrerasPeriodos
                .Where(pc => ids.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == periodId && pc.EsActivo == 1)
                .ToListAsync();

            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Where(ur => ur.User != null && ids.Contains(ur.User.IdSigafi) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .ToListAsync();

            var userIds = userRoles.Where(ur => ur.User != null).Select(ur => ur.User.IdUsuario).Distinct().ToList();
            var metadatas = await _context.InvUsuariosMetadata.Where(m => userIds.Contains(m.IdUsuario)).ToListAsync();

            result.Items = professors.Select(p => {
                var pId = p.IdProfesor.Trim();
                var hours = researchHours.Where(h => h.IdProfesor.Trim() == pId).Sum(h => h.HorasSemana);
                var contract = activeContracts.FirstOrDefault(c => c.IdProfesor.Trim() == pId);
                var roleInfo = userRoles.Where(ur => ur.User != null && ur.User.IdSigafi.Trim() == pId).ToList();
                var firstUserId = roleInfo.FirstOrDefault()?.User?.IdUsuario;
                var userMeta = firstUserId.HasValue ? metadatas.FirstOrDefault(m => m.IdUsuario == firstUserId.Value) : null;

                // Buscar carrera vinculada al docente en este periodo
                var profCareerIds = profCareers.Where(pc => pc.IdProfesor.Trim() == pId).Select(pc => pc.IdCarrera).ToList();
                var linkedCareers = careers.Where(c => profCareerIds.Contains(c.IdCarrera)).Select(c => c.Carrera1).ToList();
                var carreraNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";

                return new UserManagementDto
                {
                    IdProfesor = pId,
                    NombreCompleto = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim(),
                    Email = p.EmailInstitucional ?? p.Email ?? "",
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "DOCENTE",
                    Roles = roleInfo.Select(ur => ur.Role.Nombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.Role.CodigoRol).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.FirmaHabilitada ?? false,
                    Carrera = carreraNom,
                    Nivel = "N/A",
                    HorasInvestigacion = hours,
                    TipoDedicacion = contract?.TipoContratoNavigation?.Nombre ?? "Sin Contrato"
                };
            }).ToList();
        }

        return result;
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
                         roleCode == "DIITRA_ESTUDIANTE" ? "Estudiante DIITRA" : 
                         roleCode == "DIITRA_REVISOR_EXTERNO" ? "Revisor Externo DIITRA" : roleCode,
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
                    Contrasenia = BCrypt.Net.BCrypt.HashPassword(s.Password ?? "cambiame", 11),
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
                    Contrasenia = BCrypt.Net.BCrypt.HashPassword(p.Clave ?? "cambiame", 11),
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
            Contrasenia = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString().Substring(0, 8), 11), // Temporal
            Activo = true,
            TablaSigafi = "otros"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Registrar Metadata Profesional Académica
        _context.InvUsuariosMetadata.Add(new InvUsuarioMetadata { 
            IdUsuario = user.IdUsuario, 
            Uuid = Guid.NewGuid(), 
            Version = 1,
            Especialidad = dto.Especialidad,
            GradoAcademicoMaximo = dto.GradoAcademico
            // Nota: Podríamos añadir Institución a la base de datos si fuera necesario, 
            // por ahora usamos los campos existentes.
        });
        await _context.SaveChangesAsync();

        await AddAuditLogAsync(adminUsername, user.IdUsuario, "REGISTRO_EXTERNO", $"Registro de evaluador externo: {dto.FullName} ({dto.Institucion ?? "S/I"})");

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
                AdminName = a.UserAdmin != null ? a.UserAdmin.Nombre ?? "" : "",
                TargetName = a.UserAfectado != null ? a.UserAfectado.Nombre ?? "" : "",
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
