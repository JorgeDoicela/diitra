using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System;
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

    public async Task<PagedResult<UserManagementDto>> GetUsersAsync(
        string? searchTerm, 
        string type = "DOCENTE", 
        int page = 1, 
        int pageSize = 10, 
        string? carrera = null, 
        bool soloConHoras = false, 
        string estadoEstudiante = "ACTIVO",
        string origenEstudiante = "INSTITUTO",
        string? departamento = null,
        string? nivel = null)
    {
        searchTerm = searchTerm?.ToLower() ?? "";
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        // Obtener periodo académico (Lógica Resiliente de Descubrimiento con AsNoTracking y Proyección Directa)
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var periodId = await _context.Periodos.AsNoTracking()
            .Where(p => p.EsInstituto == 1)
            .OrderByDescending(p => p.Periodoactivoinstituto == 1) // 1. Marcado explícitamente para el sistema
            .ThenByDescending(p => p.Activo == true)             // 2. Marcado como activo genérico
            .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today) // 3. El que cubre la fecha de hoy
            .ThenByDescending(p => p.FechaInicial)               // 4. El más reciente cronológicamente
            .Select(p => p.IdPeriodo)
            .FirstOrDefaultAsync();

        var researchSubcatId = await _context.SubcategoriasActividades.AsNoTracking()
            .Where(s => s.Subcategoria == "INVESTIGACION")
            .Select(s => s.IdSubcategoria)
            .FirstOrDefaultAsync();
        if (researchSubcatId == 0) researchSubcatId = 7;

        var result = new PagedResult<UserManagementDto>
        {
            PageNumber = page,
            PageSize = pageSize
        };

        if (type == "ESTUDIANTE")
        {
            var query = _context.Alumnos.AsNoTracking().AsQueryable();

            // Segmentación por estado de estudiante (Activo matriculado vs Graduado / Histórico)
            if (!string.IsNullOrEmpty(periodId) && estadoEstudiante == "ACTIVO")
            {
                query = query.Where(a => _context.Matriculas.Any(m =>
                    m.IdAlumno == a.IdAlumno &&
                    m.IdPeriodo == periodId &&
                    (m.Retirado == null || m.Retirado == false) &&
                    (m.Valida == 1)));
            }
            else if (!string.IsNullOrEmpty(periodId) && estadoEstudiante == "GRADUADO")
            {
                query = query.Where(a => !_context.Matriculas.Any(m =>
                    m.IdAlumno == a.IdAlumno &&
                    m.IdPeriodo == periodId &&
                    (m.Retirado == null || m.Retirado == false) &&
                    (m.Valida == 1)));
            }

            // Segmentación por origen de estudiante: Instituto vs Escuela de Conducción
            if (origenEstudiante == "INSTITUTO")
            {
                if (estadoEstudiante == "ACTIVO" && !string.IsNullOrEmpty(periodId))
                {
                    query = query.Where(a => _context.Matriculas.Any(m =>
                        m.IdAlumno == a.IdAlumno &&
                        m.IdPeriodo == periodId &&
                        (m.Retirado == null || m.Retirado == false) &&
                        m.Valida == 1 &&
                        _context.Cursos.Any(c => c.IdNivel == m.IdNivel &&
                            _context.Carreras.Any(car => car.IdCarrera == c.IdCarrera && car.EsInstituto == 1))));
                }
                else
                {
                    // Graduados o Todos: Basado en su IdNivel asignado en alumnos o matrículas del instituto sin cursos de conducción
                    query = query.Where(a =>
                        (a.IdNivel != null && _context.Cursos.Any(c => c.IdNivel == a.IdNivel && _context.Carreras.Any(car => car.IdCarrera == c.IdCarrera && car.EsInstituto == 1)))
                        ||
                        (!_context.Cursos.Any(c => c.IdNivel == a.IdNivel && _context.Carreras.Any(car => car.IdCarrera == c.IdCarrera && (car.EsInstituto == 0 || car.EsInstituto == null))) &&
                         _context.Matriculas.Any(m => m.IdAlumno == a.IdAlumno && m.Valida == 1 &&
                            _context.Cursos.Any(c => c.IdNivel == m.IdNivel && _context.Carreras.Any(car => car.IdCarrera == c.IdCarrera && car.EsInstituto == 1))))
                    );
                }
            }
            else if (origenEstudiante == "CONDUCCION")
            {
                if (estadoEstudiante == "ACTIVO" && !string.IsNullOrEmpty(periodId))
                {
                    query = query.Where(a => _context.Matriculas.Any(m =>
                        m.IdAlumno == a.IdAlumno &&
                        m.IdPeriodo == periodId &&
                        (m.Retirado == null || m.Retirado == false) &&
                        m.Valida == 1 &&
                        _context.Cursos.Any(c => c.IdNivel == m.IdNivel &&
                            _context.Carreras.Any(car => car.IdCarrera == c.IdCarrera && (car.EsInstituto == 0 || car.EsInstituto == null)))));
                }
                else
                {
                    query = query.Where(a =>
                        (a.IdNivel != null && _context.Cursos.Any(c => c.IdNivel == a.IdNivel && _context.Carreras.Any(car => car.IdCarrera == c.IdCarrera && (car.EsInstituto == 0 || car.EsInstituto == null))))
                        ||
                        _context.Matriculas.Any(m => m.IdAlumno == a.IdAlumno && m.Valida == 1 &&
                            _context.Cursos.Any(c => c.IdNivel == m.IdNivel && _context.Carreras.Any(car => car.IdCarrera == c.IdCarrera && (car.EsInstituto == 0 || car.EsInstituto == null))))
                    );
                }
            }

            if (!string.IsNullOrEmpty(carrera))
            {
                var carreraLower = carrera.Trim().ToLower();
                var matchingCarreraIds = await _context.Carreras.AsNoTracking()
                    .Where(c => (c.Carrera1 != null && c.Carrera1.ToLower().Contains(carreraLower)) || (c.AliasCarrera != null && c.AliasCarrera.ToLower().Contains(carreraLower)))
                    .Select(c => c.IdCarrera)
                    .ToListAsync();

                query = query.Where(a => 
                    _context.Matriculas.Any(m =>
                        m.IdAlumno == a.IdAlumno &&
                        (m.Retirado == null || m.Retirado == false) &&
                        m.Valida == 1 &&
                        _context.Cursos.Any(c => c.IdNivel == m.IdNivel && matchingCarreraIds.Contains(c.IdCarrera)))
                    ||
                    (a.IdNivel != null && _context.Cursos.Any(c => c.IdNivel == a.IdNivel && matchingCarreraIds.Contains(c.IdCarrera)))
                );
            }

            if (!string.IsNullOrEmpty(nivel))
            {
                var nivelLower = nivel.Trim().ToLower();
                query = query.Where(a => 
                    _context.Matriculas.Any(m =>
                        m.IdAlumno == a.IdAlumno &&
                        (m.Retirado == null || m.Retirado == false) &&
                        m.Valida == 1 &&
                        _context.Cursos.Any(c => c.IdNivel == m.IdNivel && c.Nivel != null && (c.Nivel.ToLower() == nivelLower || c.Nivel.ToLower().Contains(nivelLower))))
                    ||
                    (a.IdNivel != null && _context.Cursos.Any(c => c.IdNivel == a.IdNivel && c.Nivel != null && (c.Nivel.ToLower() == nivelLower || c.Nivel.ToLower().Contains(nivelLower))))
                );
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var terms = searchTerm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                foreach (var term in terms)
                {
                    query = query.Where(a =>
                        (a.IdAlumno != null && a.IdAlumno.Contains(term)) ||
                        (a.PrimerNombre != null && a.PrimerNombre.ToLower().Contains(term)) ||
                        (a.SegundoNombre != null && a.SegundoNombre.ToLower().Contains(term)) ||
                        (a.ApellidoPaterno != null && a.ApellidoPaterno.ToLower().Contains(term)) ||
                        (a.ApellidoMaterno != null && a.ApellidoMaterno.ToLower().Contains(term)) ||
                        (a.EmailInstitucional != null && a.EmailInstitucional.ToLower().Contains(term)) ||
                        (a.Email != null && a.Email.ToLower().Contains(term))
                    );
                }
            }

            result.TotalCount = await query.CountAsync();

            var students = await query
                .OrderBy(a => a.ApellidoPaterno)
                .ThenBy(a => a.PrimerNombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ids = students.Select(s => s.IdAlumno.Trim()).ToList();

            // Obtener datos académicos extra de forma optimizada
            var currentMatriculas = await _context.Matriculas.AsNoTracking()
                .Where(m => ids.Contains(m.IdAlumno) && (string.IsNullOrEmpty(periodId) || m.IdPeriodo == periodId) && m.Valida == 1)
                .Select(m => new { m.IdAlumno, m.IdNivel })
                .ToListAsync();

            // Pre-cargar información de Cursos exclusivamente para los niveles presentes
            var levelIds = currentMatriculas.Select(m => (int?)m.IdNivel)
                .Concat(students.Select(s => s.IdNivel))
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            var relevantCursos = await _context.Cursos.AsNoTracking()
                .Where(c => levelIds.Contains(c.IdNivel))
                .Select(c => new { c.IdNivel, c.IdCarrera, c.Nivel })
                .ToListAsync();

            var relevantCarreraIds = relevantCursos.Select(c => c.IdCarrera).Distinct().ToList();
            var careers = await _context.Carreras.AsNoTracking()
                .Where(c => relevantCarreraIds.Contains(c.IdCarrera))
                .Select(c => new { c.IdCarrera, c.Carrera1, c.EsInstituto })
                .ToListAsync();

            var userRoles = await _context.UserRoles.AsNoTracking()
                .Where(ur => ur.User != null && ids.Contains(ur.User.IdSigafi) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .Select(ur => new {
                    IdUsuario = ur.IdUsuario,
                    IdSigafi = ur.User!.IdSigafi.Trim(),
                    RoleNombre = ur.Role.Nombre,
                    RoleCodigo = ur.Role.CodigoRol
                })
                .ToListAsync();

            var linkedUsers = await _context.Users.AsNoTracking()
                .Where(u => ids.Contains(u.IdSigafi.Trim()))
                .Select(u => new { u.IdUsuario, IdSigafi = u.IdSigafi.Trim(), u.EmailInstitucional })
                .ToListAsync();

            var userIds = linkedUsers.Select(u => u.IdUsuario)
                .Concat(userRoles.Select(ur => ur.IdUsuario))
                .Distinct()
                .ToList();

            var metadatas = await _context.InvUsuariosMetadata.AsNoTracking()
                .Where(m => userIds.Contains(m.IdUsuario))
                .Select(m => new { m.IdUsuario, m.Uuid, m.OrcidId, m.AceptoTerminosFirma })
                .ToListAsync();

            result.Items = students.Select(s => {
                var sId = s.IdAlumno.Trim();
                var roleInfo = userRoles.Where(ur => ur.IdSigafi == sId).ToList();
                var linkedUser = linkedUsers.FirstOrDefault(u => u.IdSigafi == sId);
                var firstUserId = linkedUser?.IdUsuario ?? roleInfo.FirstOrDefault()?.IdUsuario;
                var userMeta = firstUserId.HasValue ? metadatas.FirstOrDefault(m => m.IdUsuario == firstUserId.Value) : null;

                var matricula = currentMatriculas.FirstOrDefault(m => m.IdAlumno.Trim() == sId);

                // Lógica de descubrimiento de datos académicos vía tabla 'cursos'
                var idNivelTarget = matricula?.IdNivel ?? s.IdNivel;
                var cursoInfo = relevantCursos.FirstOrDefault(c => c.IdNivel == idNivelTarget);

                var carreraObj = careers.FirstOrDefault(c => c.IdCarrera == cursoInfo?.IdCarrera);
                var carreraNom = carreraObj?.Carrera1;
                var nivelNom = cursoInfo?.Nivel;

                return new UserManagementDto
                {
                    IdUsuario = firstUserId,
                    IdProfesor = sId,
                    NombreCompleto = $"{s.PrimerNombre} {s.SegundoNombre} {s.ApellidoPaterno} {s.ApellidoMaterno}".Replace("  ", " ").Trim(),
                    Email = ResolveContactEmail(s.EmailInstitucional, s.Email, linkedUser?.EmailInstitucional),
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "ESTUDIANTE",
                    Roles = roleInfo.Select(ur => ur.RoleNombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.RoleCodigo).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.AceptoTerminosFirma ?? false,
                    Carrera = carreraNom ?? "No vinculada",
                    Nivel = nivelNom ?? "N/A",
                    EsGraduado = matricula == null,
                    EsInstituto = carreraObj?.EsInstituto == 1
                };
            }).ToList();
        }
        else if (type == "EXTERNO")
        {
            // Verdaderos externos: no están en profesores ni en alumnos del instituto
            var query = _context.Users.AsNoTracking()
                .Where(u => (u.TablaSigafi == "otros" || u.TablaSigafi == "externo" || _context.UserRoles.Any(ur => ur.IdUsuario == u.IdUsuario && ur.Role.CodigoRol == "DIITRA_REVISOR_EXTERNO"))
                    && !_context.Profesores.Any(p => p.IdProfesor == u.IdSigafi)
                    && !_context.Alumnos.Any(a => a.IdAlumno == u.IdSigafi));

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var terms = searchTerm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                foreach (var term in terms)
                {
                    query = query.Where(u =>
                        (u.IdSigafi != null && u.IdSigafi.Contains(term)) ||
                        (u.Nombre != null && u.Nombre.ToLower().Contains(term)) ||
                        (u.EmailInstitucional != null && u.EmailInstitucional.ToLower().Contains(term))
                    );
                }
            }

            result.TotalCount = await query.CountAsync();

            var externalUsers = await query
                .OrderBy(u => u.Nombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ids = externalUsers.Select(u => u.IdUsuario).ToList();

            var userRoles = await _context.UserRoles.AsNoTracking()
                .Where(ur => ids.Contains(ur.IdUsuario) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .Select(ur => new {
                    IdUsuario = ur.IdUsuario,
                    RoleNombre = ur.Role.Nombre,
                    RoleCodigo = ur.Role.CodigoRol
                })
                .ToListAsync();

            var metadatas = await _context.InvUsuariosMetadata.AsNoTracking()
                .Where(m => ids.Contains(m.IdUsuario))
                .Select(m => new { m.IdUsuario, m.Uuid, m.OrcidId, m.AceptoTerminosFirma })
                .ToListAsync();

            var externalIds = externalUsers.Select(u => u.IdSigafi.Trim()).ToList();
            var fallbackProfs = await _context.Profesores.AsNoTracking()
                .Where(p => externalIds.Contains(p.IdProfesor.Trim()))
                .Select(p => new {
                    IdProfesor = p.IdProfesor.Trim(),
                    NombreCompleto = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim()
                })
                .ToListAsync();

            var fallbackStudents = await _context.Alumnos.AsNoTracking()
                .Where(a => externalIds.Contains(a.IdAlumno.Trim()))
                .Select(a => new {
                    IdAlumno = a.IdAlumno.Trim(),
                    NombreCompleto = $"{a.PrimerNombre} {a.SegundoNombre} {a.ApellidoPaterno} {a.ApellidoMaterno}".Replace("  ", " ").Trim()
                })
                .ToListAsync();

            result.Items = externalUsers.Select(u => {
                var sId = u.IdSigafi.Trim();
                var roleInfo = userRoles.Where(ur => ur.IdUsuario == u.IdUsuario).ToList();
                var userMeta = metadatas.FirstOrDefault(m => m.IdUsuario == u.IdUsuario);

                var prof = fallbackProfs.FirstOrDefault(p => p.IdProfesor == sId);
                var student = fallbackStudents.FirstOrDefault(a => a.IdAlumno == sId);
                
                string nombreCompleto = u.Nombre ?? "";
                if (prof != null) {
                    nombreCompleto = prof.NombreCompleto;
                } else if (student != null) {
                    nombreCompleto = student.NombreCompleto;
                }

                if (string.IsNullOrWhiteSpace(nombreCompleto)) {
                    nombreCompleto = u.IdSigafi;
                }

                return new UserManagementDto
                {
                    IdUsuario = u.IdUsuario,
                    IdProfesor = sId,
                    NombreCompleto = nombreCompleto,
                    Email = ResolveContactEmail(u.EmailInstitucional, u.IdSigafi.Contains("@") ? u.IdSigafi : null),
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "EXTERNO",
                    Roles = roleInfo.Select(ur => ur.RoleNombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.RoleCodigo).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.AceptoTerminosFirma ?? false
                };
            }).ToList();
        }
        else if (type == "ADMINISTRATIVO")
        {
            // Personal estrictamente administrativo o con funciones no docentes
            var query = _context.Profesores.AsNoTracking().Where(p => p.Activo == 1 &&
                !(_context.Contratos.Any(c => c.IdProfesor == p.IdProfesor && (c.EsActivo == 1 || c.EsActivo == null) &&
                    c.DepartamentoNavigation != null && c.DepartamentoNavigation.NombreDepartamento == "DOCENCIA" &&
                    (c.CargoInstitutoNavigation == null || 
                     c.CargoInstitutoNavigation.Nombre == null ||
                     c.CargoInstitutoNavigation.Nombre.ToLower().Contains("profesor") || 
                     c.CargoInstitutoNavigation.Nombre.ToLower().Contains("docente")))));

            if (!string.IsNullOrEmpty(departamento))
            {
                if (departamento.Equals("Sin departamento asignado", StringComparison.OrdinalIgnoreCase) ||
                    departamento.Equals("SIN_ASIGNAR", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => !_context.Contratos.Any(c =>
                        c.IdProfesor == p.IdProfesor &&
                        (c.EsActivo == 1 || c.EsActivo == null) &&
                        c.Iddepartamentos != null &&
                        c.DepartamentoNavigation != null));
                }
                else
                {
                    var deptoLower = departamento.ToLower();
                    query = query.Where(p => _context.Contratos.Any(c =>
                        c.IdProfesor == p.IdProfesor &&
                        (c.EsActivo == 1 || c.EsActivo == null) &&
                        c.DepartamentoNavigation != null &&
                        c.DepartamentoNavigation.NombreDepartamento != null &&
                        c.DepartamentoNavigation.NombreDepartamento.ToLower().Contains(deptoLower)));
                }
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var terms = searchTerm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                foreach (var term in terms)
                {
                    query = query.Where(p =>
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

            result.TotalCount = await query.CountAsync();

            var admins = await query
                .OrderBy(p => p.PrimerApellido)
                .ThenBy(p => p.PrimerNombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ids = admins.Select(p => p.IdProfesor.Trim()).ToList();

            var contracts = await _context.Contratos.AsNoTracking()
                .Where(c => ids.Contains(c.IdProfesor.Trim()) && (c.EsActivo == 1 || c.EsActivo == null))
                .Select(c => new {
                    IdProfesor = c.IdProfesor.Trim(),
                    Departamento = c.DepartamentoNavigation != null ? c.DepartamentoNavigation.NombreDepartamento : null,
                    CargoInstituto = c.CargoInstitutoNavigation != null ? c.CargoInstitutoNavigation.Nombre : null,
                    TipoContrato = c.TipoContratoNavigation != null ? c.TipoContratoNavigation.Nombre : null
                })
                .ToListAsync();

            var linkedUsers = await _context.Users.AsNoTracking()
                .Where(u => ids.Contains(u.IdSigafi.Trim()))
                .Select(u => new { u.IdUsuario, IdSigafi = u.IdSigafi.Trim(), u.EmailInstitucional })
                .ToListAsync();

            var userRoles = await _context.UserRoles.AsNoTracking()
                .Where(ur => ur.User != null && ids.Contains(ur.User.IdSigafi) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .Select(ur => new {
                    IdUsuario = ur.IdUsuario,
                    IdSigafi = ur.User!.IdSigafi.Trim(),
                    RoleNombre = ur.Role.Nombre,
                    RoleCodigo = ur.Role.CodigoRol
                })
                .ToListAsync();

            var userIds = linkedUsers.Select(u => u.IdUsuario)
                .Concat(userRoles.Select(ur => ur.IdUsuario))
                .Distinct()
                .ToList();

            var metadatas = await _context.InvUsuariosMetadata.AsNoTracking()
                .Where(m => userIds.Contains(m.IdUsuario))
                .Select(m => new { m.IdUsuario, m.Uuid, m.OrcidId, m.AceptoTerminosFirma })
                .ToListAsync();

            result.Items = admins.Select(p => {
                var pId = p.IdProfesor.Trim();
                var contract = contracts.FirstOrDefault(c => c.IdProfesor == pId);
                var roleInfo = userRoles.Where(ur => ur.IdSigafi == pId).ToList();
                var linkedUser = linkedUsers.FirstOrDefault(u => u.IdSigafi == pId);
                var firstUserId = linkedUser?.IdUsuario ?? roleInfo.FirstOrDefault()?.IdUsuario;
                var userMeta = firstUserId.HasValue ? metadatas.FirstOrDefault(m => m.IdUsuario == firstUserId.Value) : null;

                return new UserManagementDto
                {
                    IdUsuario = firstUserId,
                    IdProfesor = pId,
                    NombreCompleto = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim(),
                    Email = ResolveContactEmail(p.EmailInstitucional, p.Email, linkedUser?.EmailInstitucional),
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "ADMINISTRATIVO",
                    Roles = roleInfo.Select(ur => ur.RoleNombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.RoleCodigo).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.AceptoTerminosFirma ?? false,
                    Departamento = contract?.Departamento ?? "Sin departamento asignado",
                    CargoInstituto = contract?.CargoInstituto ?? "Personal Institucional",
                    TipoContrato = contract?.TipoContrato ?? "Sin contrato registrado",
                    Carrera = "Gestión Institucional",
                    Nivel = "N/A"
                };
            }).ToList();
        }
        else // DOCENTE
        {
            // Planta docente: vinculados a Docencia, Carreras o Actividades Académicas
            var query = _context.Profesores.AsNoTracking().Where(p => p.Activo == 1 &&
                (_context.Contratos.Any(c => c.IdProfesor == p.IdProfesor && (c.EsActivo == 1 || c.EsActivo == null) &&
                    ((c.DepartamentoNavigation != null && c.DepartamentoNavigation.NombreDepartamento == "DOCENCIA") ||
                     (c.CargoInstitutoNavigation != null && c.CargoInstitutoNavigation.Nombre != null && (c.CargoInstitutoNavigation.Nombre.ToLower().Contains("profesor") || c.CargoInstitutoNavigation.Nombre.ToLower().Contains("docente")))))
                 || _context.ProfesoresCarrerasPeriodos.Any(pc => pc.IdProfesor == p.IdProfesor)
                 || _context.ProfesoresActividades.Any(pa => pa.IdProfesor == p.IdProfesor)
                ));

            // Filtrar por docentes que tengan actividades de investigación (idSubcategoria = researchSubcatId) en el periodo actual SOLO si soloConHoras es true
            if (soloConHoras && !string.IsNullOrEmpty(periodId))
            {
                query = query.Where(p => _context.ProfesoresActividades.Any(pa =>
                    pa.IdProfesor == p.IdProfesor &&
                    pa.IdSubcategoria == researchSubcatId &&
                    pa.IdPeriodo == periodId));
            }

            if (!string.IsNullOrEmpty(carrera))
            {
                var carreraLower = carrera.ToLower();
                var matchingCarreraIds = await _context.Carreras.AsNoTracking()
                    .Where(c => (c.Carrera1 != null && c.Carrera1.ToLower().Contains(carreraLower)) || (c.AliasCarrera != null && c.AliasCarrera.ToLower().Contains(carreraLower)))
                    .Select(c => c.IdCarrera)
                    .ToListAsync();

                query = query.Where(p => _context.ProfesoresCarrerasPeriodos.Any(pc =>
                    pc.IdProfesor == p.IdProfesor &&
                    (string.IsNullOrEmpty(periodId) || pc.IdPeriodo == periodId || pc.EsActivo == 1) &&
                    pc.IdCarrera != null &&
                    matchingCarreraIds.Contains(pc.IdCarrera.Value)));
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var terms = searchTerm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                foreach (var term in terms)
                {
                    query = query.Where(p =>
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

            result.TotalCount = await query.CountAsync();

            var professors = await query
                .OrderBy(p => p.PrimerApellido)
                .ThenBy(p => p.PrimerNombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ids = professors.Select(p => p.IdProfesor.Trim()).ToList();

            var contracts = await _context.Contratos.AsNoTracking()
                .Where(c => ids.Contains(c.IdProfesor.Trim()) && (c.EsActivo == 1 || c.EsActivo == null))
                .Select(c => new {
                    IdProfesor = c.IdProfesor.Trim(),
                    Departamento = c.DepartamentoNavigation != null ? c.DepartamentoNavigation.NombreDepartamento : null,
                    CargoInstituto = c.CargoInstitutoNavigation != null ? c.CargoInstitutoNavigation.Nombre : null,
                    TipoContrato = c.TipoContratoNavigation != null ? c.TipoContratoNavigation.Nombre : null
                })
                .ToListAsync();

            var linkedUsers = await _context.Users.AsNoTracking()
                .Where(u => ids.Contains(u.IdSigafi.Trim()))
                .Select(u => new { u.IdUsuario, IdSigafi = u.IdSigafi.Trim(), u.EmailInstitucional })
                .ToListAsync();

            // Obtener horas de investigación (idSubcategoria = researchSubcatId)
            var researchHours = await _context.ProfesoresActividades.AsNoTracking()
                .Where(pa => ids.Contains(pa.IdProfesor) && pa.IdSubcategoria == researchSubcatId && (string.IsNullOrEmpty(periodId) || pa.IdPeriodo == periodId))
                .Select(pa => new { IdProfesor = pa.IdProfesor.Trim(), pa.HorasSemana })
                .ToListAsync();

            // Obtener horas comprometidas en proyectos activos/enviados
            var linkedUserIdsQuery = linkedUsers.Select(u => u.IdUsuario).ToList();
            var estadosConCarga = await _context.InvConfigWorkflows.AsNoTracking()
                .Where(w => w.Activo && w.ContabilizaCargaHoraria)
                .Select(w => w.EstadoDestino)
                .Distinct()
                .ToListAsync();
            if (estadosConCarga == null || !estadosConCarga.Any())
            {
                estadosConCarga = new List<string> { "Enviado", "En Revisión", "Aprobado", "En Ejecución" };
            }

            var assignedHoursList = await _context.InvProyectoParticipantes.AsNoTracking()
                .Where(pp => pp.TipoParticipante == "Docente" && linkedUserIdsQuery.Contains(pp.IdUsuario) && pp.Activo != false &&
                             pp.IdProyectoNavigation != null && estadosConCarga.Contains(pp.IdProyectoNavigation.Estado))
                .Select(pp => new { pp.IdUsuario, pp.HorasSemanales })
                .ToListAsync();

            // Obtener carreras vinculadas a los docentes en este periodo cargando su navegación
            var profCareers = await _context.ProfesoresCarrerasPeriodos.AsNoTracking()
                .Where(pc => ids.Contains(pc.IdProfesor.Trim()) && (string.IsNullOrEmpty(periodId) || pc.IdPeriodo == periodId) && pc.EsActivo == 1 && pc.IdCarreraNavigation != null)
                .Select(pc => new {
                    IdProfesor = pc.IdProfesor.Trim(),
                    Carrera = pc.IdCarreraNavigation!.Carrera1
                })
                .ToListAsync();

            var userRoles = await _context.UserRoles.AsNoTracking()
                .Where(ur => ur.User != null && ids.Contains(ur.User.IdSigafi) && (ur.EsActivo ?? true))
                .Where(ur => ur.Role.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
                .Select(ur => new {
                    IdUsuario = ur.IdUsuario,
                    IdSigafi = ur.User!.IdSigafi.Trim(),
                    RoleNombre = ur.Role.Nombre,
                    RoleCodigo = ur.Role.CodigoRol
                })
                .ToListAsync();

            var userIds = linkedUsers.Select(u => u.IdUsuario)
                .Concat(userRoles.Select(ur => ur.IdUsuario))
                .Distinct()
                .ToList();

            var metadatas = await _context.InvUsuariosMetadata.AsNoTracking()
                .Where(m => userIds.Contains(m.IdUsuario))
                .Select(m => new { m.IdUsuario, m.Uuid, m.OrcidId, m.AceptoTerminosFirma })
                .ToListAsync();

            result.Items = professors.Select(p => {
                var pId = p.IdProfesor.Trim();
                var contract = contracts.FirstOrDefault(c => c.IdProfesor == pId);
                var hours = researchHours.Where(h => h.IdProfesor == pId).Sum(h => h.HorasSemana);
                var roleInfo = userRoles.Where(ur => ur.IdSigafi == pId).ToList();
                var linkedUser = linkedUsers.FirstOrDefault(u => u.IdSigafi == pId);
                var firstUserId = linkedUser?.IdUsuario ?? roleInfo.FirstOrDefault()?.IdUsuario;
                var userMeta = firstUserId.HasValue ? metadatas.FirstOrDefault(m => m.IdUsuario == firstUserId.Value) : null;

                var assignedHours = firstUserId.HasValue
                    ? assignedHoursList.Where(ah => ah.IdUsuario == firstUserId.Value).Sum(ah => ah.HorasSemanales ?? 0)
                    : 0;

                var linkedCareers = profCareers
                    .Where(pc => pc.IdProfesor == pId && !string.IsNullOrEmpty(pc.Carrera))
                    .Select(pc => pc.Carrera!)
                    .Distinct()
                    .ToList();
                var carreraNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";

                return new UserManagementDto
                {
                    IdUsuario = firstUserId,
                    IdProfesor = pId,
                    NombreCompleto = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim(),
                    Email = ResolveContactEmail(p.EmailInstitucional, p.Email, linkedUser?.EmailInstitucional),
                    UserUuid = userMeta?.Uuid.ToString() ?? "",
                    Type = "DOCENTE",
                    Roles = roleInfo.Select(ur => ur.RoleNombre).ToList(),
                    RoleCodes = roleInfo.Select(ur => ur.RoleCodigo).ToList(),
                    OrcidId = userMeta?.OrcidId,
                    FirmaHabilitada = userMeta?.AceptoTerminosFirma ?? false,
                    Carrera = carreraNom,
                    Nivel = "N/A",
                    HorasInvestigacion = hours,
                    HorasAsignadas = assignedHours,
                    Departamento = contract?.Departamento,
                    CargoInstituto = contract?.CargoInstituto,
                    TipoContrato = contract?.TipoContrato
                };
            }).ToList();
        }

        return result;
    }

    public async Task<List<RoleDto>> GetAvailableRolesAsync()
    {
        return await _context.Roles.AsNoTracking()
            .Where(r => r.RoleModuleOperations.Any(rmo => rmo.ModuleOperation.Module.Sistema.Codigo == "DIITRA"))
            .Select(r => new RoleDto {
                IdRol = r.IdRol,
                Nombre = r.Nombre,
                CodigoRol = r.CodigoRol
            })
            .ToListAsync();
    }

    public async Task<List<string>> GetDepartmentsAsync()
    {
        var list = await _context.Departamentos.AsNoTracking()
            .Where(d => !string.IsNullOrEmpty(d.NombreDepartamento) && d.NombreDepartamento != "DOCENCIA")
            .Select(d => d.NombreDepartamento!.Trim())
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();

        list.Insert(0, "Sin departamento asignado");
        return list;
    }

    public async Task<UserMetadataDto?> GetUserMetadataAsync(string userUuid)
    {
        var meta = await _context.InvUsuariosMetadata.AsNoTracking()
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Uuid.ToString() == userUuid);

        if (meta == null) return null;

        return new UserMetadataDto {
            OrcidId = meta.OrcidId,
            ScopusId = meta.ScopusId,
            GoogleScholarUrl = meta.GoogleScholarUrl,
            ResearchGateUrl = meta.ResearchGateUrl,
            Especialidad = meta.Especialidad,
            GradoAcademicoMaximo = meta.GradoAcademicoMaximo,
            Nombre = meta.User?.Nombre,
            Email = meta.User?.EmailInstitucional
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

        if (meta.User != null && meta.User.TablaSigafi == "otros")
        {
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var cleanEmail = dto.Email.Trim().ToLower();
                var emailExists = await _context.Users.AnyAsync(u => 
                    u.IdUsuario != meta.IdUsuario 
                    && u.Activo 
                    && u.EmailInstitucional != null 
                    && u.EmailInstitucional.ToLower() == cleanEmail);

                if (emailExists)
                {
                    throw new InvalidOperationException("El correo electrónico ya se encuentra registrado para otro usuario activo.");
                }

                meta.User.EmailInstitucional = dto.Email.Trim();
                if (meta.User.IdSigafi.Contains("@"))
                {
                    meta.User.IdSigafi = dto.Email.Trim();
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.Nombre))
            {
                meta.User.Nombre = dto.Nombre.Trim();
            }
        }

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
                    TablaSigafi = "alumno",
                    EmailInstitucional = s.EmailInstitucional ?? s.Email
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
                    TablaSigafi = "profesor",
                    EmailInstitucional = p.EmailInstitucional ?? p.Email
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
            if (existingUser.TablaSigafi == "otros")
            {
                throw new InvalidOperationException("La cédula o correo ingresado ya corresponde a un evaluador externo registrado en el sistema.");
            }
            throw new InvalidOperationException("La cédula o correo ingresado ya corresponde a un usuario registrado en el sistema.");
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
            Contrasenia = BCrypt.Net.BCrypt.HashPassword("Diitra2026*", 11),
            Activo = true,
            TablaSigafi = "otros",
            EmailInstitucional = dto.Email
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
        return await _context.Set<InvAuditAdmin>().AsNoTracking()
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
        var query = _context.Set<InvAuditAdmin>().AsNoTracking()
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
                (a.UserAdmin != null && a.UserAdmin.Nombre != null && a.UserAdmin.Nombre.ToLower().Contains(searchTerm)) ||
                (a.UserAfectado != null && a.UserAfectado.Nombre != null && a.UserAfectado.Nombre.ToLower().Contains(searchTerm))
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

    /// <summary>Primer valor no vacío que parezca correo electrónico.</summary>
    private static string ResolveContactEmail(params string?[] candidates)
    {
        foreach (var raw in candidates)
        {
            if (string.IsNullOrWhiteSpace(raw)) continue;
            var value = raw.Trim();
            if (value.Contains('@', StringComparison.Ordinal))
                return value;
        }
        return string.Empty;
    }

}
