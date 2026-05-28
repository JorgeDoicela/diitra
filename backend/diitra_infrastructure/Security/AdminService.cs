using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Linq;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.Security;

public class AdminService : IAdminService
{
    private readonly DiitraContext _context;
    private readonly IAuditService _auditService;

    public AdminService(DiitraContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
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
                .Where(u => u.TablaSigafi == "otros" && _context.UserRoles.Any(ur => ur.IdUsuario == u.IdUsuario && ur.Role.CodigoRol == "DIITRA_REVISOR_EXTERNO"));

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

                if (string.IsNullOrWhiteSpace(nombreCompleto)) {
                    nombreCompleto = u.IdSigafi;
                }

                return new UserManagementDto
                {
                    IdUsuario = u.IdUsuario,
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
                    IdUsuario = firstUserId,
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

    public async Task<bool> UpdateUserMetadataAsync(string userUuid, UserMetadataDto dto)
    {
        var meta = await _context.InvUsuariosMetadata.Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Uuid.ToString() == userUuid);

        if (meta == null) return false;

        var beforeState = new
        {
            OrcidId = meta.OrcidId,
            ScopusId = meta.ScopusId,
            GoogleScholarUrl = meta.GoogleScholarUrl,
            ResearchGateUrl = meta.ResearchGateUrl,
            Especialidad = meta.Especialidad,
            GradoAcademicoMaximo = meta.GradoAcademicoMaximo
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        meta.OrcidId = dto.OrcidId;
        meta.ScopusId = dto.ScopusId;
        meta.GoogleScholarUrl = dto.GoogleScholarUrl;
        meta.ResearchGateUrl = dto.ResearchGateUrl;
        meta.Especialidad = dto.Especialidad;
        meta.GradoAcademicoMaximo = dto.GradoAcademicoMaximo;
        meta.Version++;

        await _context.SaveChangesAsync();

        var afterState = new
        {
            OrcidId = meta.OrcidId,
            ScopusId = meta.ScopusId,
            GoogleScholarUrl = meta.GoogleScholarUrl,
            ResearchGateUrl = meta.ResearchGateUrl,
            Especialidad = meta.Especialidad,
            GradoAcademicoMaximo = meta.GradoAcademicoMaximo
        };
        string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

        await _auditService.LogActionAsync(
            meta.IdUsuario, 
            "ACTUALIZAR_METADATA", 
            $"Actualización de perfil científico y académico.", 
            "USUARIOS",
            beforeJson,
            afterJson
        );

        return true;
    }

    public async Task<bool> AssignRoleAsync(string idUsuario, string roleCode, string userType = "DOCENTE")
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

        var rolesBefore = await _context.UserRoles
            .Where(ur => ur.IdUsuario == user.IdUsuario && (ur.EsActivo ?? true))
            .Include(ur => ur.Role)
            .Select(ur => ur.Role.CodigoRol)
            .ToListAsync();
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(new { RolesActivos = rolesBefore });

        var existing = await _context.UserRoles.FirstOrDefaultAsync(ur => ur.IdUsuario == user.IdUsuario && ur.IdRol == role.IdRol);
        if (existing != null) {
            existing.EsActivo = true;
            existing.FechaModificacion = DateOnly.FromDateTime(DateTime.UtcNow);
        } else {
            _context.UserRoles.Add(new UserRole { IdUsuario = user.IdUsuario, IdRol = role.IdRol, EsActivo = true, FechaCreacion = DateOnly.FromDateTime(DateTime.UtcNow) });
        }

        await _context.SaveChangesAsync();

        var rolesAfter = await _context.UserRoles
            .Where(ur => ur.IdUsuario == user.IdUsuario && (ur.EsActivo ?? true))
            .Include(ur => ur.Role)
            .Select(ur => ur.Role.CodigoRol)
            .ToListAsync();
        string afterJson = System.Text.Json.JsonSerializer.Serialize(new { RolesActivos = rolesAfter, RolAsignado = role.CodigoRol });

        await _auditService.LogActionAsync(user.IdUsuario, "ASIGNAR_ROL", $"Asignación del rol {role.Nombre}", "SEGURIDAD", beforeJson, afterJson);

        return true;
    }

    public async Task<bool> RevokeRoleAsync(string idUsuario, string roleCode, string userType = "DOCENTE")
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == roleCode || r.Nombre == roleCode);
        if (role == null) return false;

        var existing = await _context.UserRoles
            .Include(ur => ur.User)
            .FirstOrDefaultAsync(ur => ur.User.IdSigafi == idUsuario && ur.IdRol == role.IdRol);

        if (existing != null)
        {
            var rolesBefore = await _context.UserRoles
                .Where(ur => ur.IdUsuario == existing.IdUsuario && (ur.EsActivo ?? true))
                .Include(ur => ur.Role)
                .Select(ur => ur.Role.CodigoRol)
                .ToListAsync();
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(new { RolesActivos = rolesBefore });

            existing.EsActivo = false;
            existing.FechaModificacion = DateOnly.FromDateTime(DateTime.UtcNow);
            await _context.SaveChangesAsync();

            var rolesAfter = await _context.UserRoles
                .Where(ur => ur.IdUsuario == existing.IdUsuario && (ur.EsActivo ?? true))
                .Include(ur => ur.Role)
                .Select(ur => ur.Role.CodigoRol)
                .ToListAsync();
            string afterJson = System.Text.Json.JsonSerializer.Serialize(new { RolesActivos = rolesAfter, RolRevocado = role.CodigoRol });

            await _auditService.LogActionAsync(existing.IdUsuario, "REVOCAR_ROL", $"Revocación del rol {role.Nombre}", "SEGURIDAD", beforeJson, afterJson);
        }

        return true;
    }

    public async Task<bool> RegisterExternalUserAsync(ExternalUserDto dto)
    {
        // 1. Validar contra usuarios existentes
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == dto.Cedula || u.IdSigafi == dto.Email);
        
        if (existingUser != null)
        {
            if (existingUser.TablaSigafi == "profesor")
            {
                throw new InvalidOperationException("La cédula o correo ingresado ya corresponde a un docente interno de la institución.");
            }
            if (existingUser.TablaSigafi == "alumno")
            {
                throw new InvalidOperationException("La cédula o correo ingresado ya corresponde a un estudiante matriculado.");
            }
            
            var hasMeta = await _context.InvUsuariosMetadata.AnyAsync(m => m.IdUsuario == existingUser.IdUsuario);
            if (hasMeta)
            {
                throw new InvalidOperationException("Este evaluador externo ya se encuentra registrado en el sistema.");
            }
        }

        // 2. Validar contra tablas base de profesores (por si no tienen usuario aún)
        var existingProf = await _context.Profesores.AnyAsync(p => p.IdProfesor == dto.Cedula || p.EmailInstitucional == dto.Email || p.Email == dto.Email);
        if (existingProf)
        {
            throw new InvalidOperationException("La cédula o correo ingresado ya corresponde a un docente registrado en la institución.");
        }

        // 3. Validar contra tablas base de alumnos (por si no tienen usuario aún)
        var existingAlum = await _context.Alumnos.AnyAsync(a => a.IdAlumno == dto.Cedula || a.EmailInstitucional == dto.Email || a.Email == dto.Email);
        if (existingAlum)
        {
            throw new InvalidOperationException("La cédula o correo ingresado ya corresponde a un estudiante en el registro institucional.");
        }

        // Si pasa las validaciones, creamos el usuario externo
        string nombreCompleto = !string.IsNullOrEmpty(dto.FullName) 
            ? dto.FullName 
            : $"{dto.Nombres} {dto.Apellidos}".Trim();

        var user = new User
        {
            IdSigafi = dto.Cedula,
            Nombre = nombreCompleto,
            Contrasenia = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString().Substring(0, 8), 11),
            Activo = true,
            TablaSigafi = "otros"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _context.InvUsuariosMetadata.Add(new InvUsuarioMetadata
        {
            IdUsuario = user.IdUsuario,
            Uuid = Guid.NewGuid(),
            Version = 1,
            Especialidad = dto.Especialidad,
            GradoAcademicoMaximo = dto.GradoAcademico,
            OrcidId = dto.OrcidId
        });
        await _context.SaveChangesAsync();

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == dto.DefaultRole);
        if (role == null)
        {
            role = new Role { CodigoRol = dto.DefaultRole, Nombre = dto.DefaultRole, EsActivo = true };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        _context.UserRoles.Add(new UserRole { IdUsuario = user.IdUsuario, IdRol = role.IdRol, EsActivo = true, FechaCreacion = DateOnly.FromDateTime(DateTime.UtcNow) });
        await _context.SaveChangesAsync();

        string afterJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            Cedula = dto.Cedula,
            Nombre = user.Nombre,
            Institucion = dto.Institucion ?? "No especificada",
            GradoAcademico = dto.GradoAcademico ?? "No especificado",
            Especialidad = dto.Especialidad ?? "No especificada",
            RolAsignado = role.CodigoRol
        });

        await _auditService.LogActionAsync(user.IdUsuario, "REGISTRO_EXTERNO", $"Registro de evaluador externo: {user.Nombre} ({dto.Institucion ?? "S/I"})", "USUARIOS", null, afterJson);

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

    public async Task<PagedResult<AuditLogDto>> GetAuditLogsPagedAsync(DateTime? from, DateTime? to, string? action, string? modulo, string? searchTerm, int page = 1, int pageSize = 20)
    {
        var query = _context.Set<InvAuditAdmin>()
            .Include(a => a.UserAdmin)
            .Include(a => a.UserAfectado)
            .AsQueryable();

        if (from.HasValue) query = query.Where(a => a.Fecha >= from.Value);
        if (to.HasValue) query = query.Where(a => a.Fecha <= to.Value);
        if (!string.IsNullOrEmpty(action)) query = query.Where(a => a.Accion == action);
        if (!string.IsNullOrEmpty(modulo)) query = query.Where(a => a.Modulo == modulo);
        if (!string.IsNullOrEmpty(searchTerm))
        {
            searchTerm = searchTerm.ToLower();
            query = query.Where(a => 
                (a.Detalle != null && a.Detalle.ToLower().Contains(searchTerm)) ||
                (a.UserAdmin.Nombre != null && a.UserAdmin.Nombre.ToLower().Contains(searchTerm)) ||
                (a.UserAfectado.Nombre != null && a.UserAfectado.Nombre.ToLower().Contains(searchTerm))
            );
        }

        var result = new PagedResult<AuditLogDto> {
            PageNumber = page,
            PageSize = pageSize,
            TotalCount = await query.CountAsync()
        };

        result.Items = await query
            .OrderByDescending(a => a.Fecha)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto {
                IdAudit = a.IdAudit,
                AdminName = a.UserAdmin != null ? a.UserAdmin.Nombre ?? "" : "",
                TargetName = a.UserAfectado != null ? a.UserAfectado.Nombre ?? "" : "",
                Action = a.Accion,
                Modulo = a.Modulo,
                Details = a.Detalle,
                IpAddress = a.IpOrigen,
                UserAgent = a.UserAgent,
                ValuesBefore = a.ValoresAnteriores,
                ValuesAfter = a.ValoresNuevos,
                Date = a.Fecha
            })
            .ToListAsync();

        return result;
    }

}
