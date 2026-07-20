using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research;

public partial class GroupsService
{
    public async Task<IEnumerable<GroupDto>> GetAllAsync(string? search = null, string? userSigafiId = null, bool isAdmin = false, string? memberCedula = null)
    {
        var query = _context.InvGruposInvestigacion
            .Include(g => g.IdCoordinadorNavigation)
            .Include(g => g.IdLineas)
            .Include(g => g.IdCarreras)
            .Include(g => g.InvGruposMiembros)
                .ThenInclude(m => m.IdUsuarioNavigation)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(g => g.Nombre.Contains(search) || g.Siglas!.Contains(search));
        }

        if (!isAdmin && !string.IsNullOrEmpty(userSigafiId))
        {
            var userSigafiTrim = userSigafiId.Trim();
            query = query.Where(g => g.Estado == "Aprobado" 
                || (g.IdCoordinadorNavigation != null && g.IdCoordinadorNavigation.IdSigafi == userSigafiTrim)
                || g.InvGruposMiembros.Any(m => m.IdUsuarioNavigation != null && m.IdUsuarioNavigation.IdSigafi == userSigafiTrim && m.Activo != false));
        }

        if (!string.IsNullOrEmpty(memberCedula))
        {
            var memberCedulaTrim = memberCedula.Trim();
            query = query.Where(g => 
                (g.IdCoordinadorNavigation != null && g.IdCoordinadorNavigation.IdSigafi == memberCedulaTrim)
                || g.InvGruposMiembros.Any(m => m.IdUsuarioNavigation != null && m.IdUsuarioNavigation.IdSigafi == memberCedulaTrim && m.Activo != false));
        }

        var groups = await query.ToListAsync();

        return groups.Select(g => 
        {
            var dto = MapToDto(g);
            dto.LineasIds = g.IdLineas.Select(l => l.IdLinea).ToList();
            dto.CarrerasIds = g.IdCarreras.Select(c => c.IdCarrera).ToList();
            return dto;
        }).ToList();
    }

    public async Task<GroupDto?> GetByUuidAsync(string uuid)
    {
        var group = await _context.InvGruposInvestigacion
            .Include(g => g.IdCoordinadorNavigation)
            .Include(g => g.IdLineas)
            .Include(g => g.IdCarreras)
            .Include(g => g.InvGruposMiembros)
                .ThenInclude(m => m.IdUsuarioNavigation)
            .FirstOrDefaultAsync(g => g.Uuid == uuid);

        if (group == null) return null;

        var dto = MapToDto(group);
        dto.LineasIds = group.IdLineas.Select(l => l.IdLinea).ToList();
        dto.CarrerasIds = group.IdCarreras.Select(c => c.IdCarrera).ToList();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentPeriod = await _context.Periodos
            .Where(p => p.EsInstituto == 1)
            .OrderByDescending(p => p.Periodoactivoinstituto == 1)
            .ThenByDescending(p => p.Activo == true)
            .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
            .ThenByDescending(p => p.FechaInicial)
            .FirstOrDefaultAsync();
        var periodId = currentPeriod?.IdPeriodo;

        var memberCedulas = group.InvGruposMiembros
            .Select(m => m.IdUsuarioNavigation?.IdSigafi?.Trim())
            .Where(c => !string.IsNullOrEmpty(c))
            .Cast<string>()
            .ToList();

        var teacherCareers = new List<ProfesoresCarrerasPeriodo>();
        if (memberCedulas.Any() && !string.IsNullOrEmpty(periodId))
        {
            teacherCareers = await _context.ProfesoresCarrerasPeriodos
                .Include(pc => pc.IdCarreraNavigation)
                .Where(pc => memberCedulas.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == periodId && pc.EsActivo == 1)
                .ToListAsync();
        }

        var studentCareers = new List<AlumnosCarrera>();
        if (memberCedulas.Any() && !string.IsNullOrEmpty(periodId))
        {
            var matriculas = await _context.Matriculas
                .Where(m => memberCedulas.Contains(m.IdAlumno.Trim()) && m.IdPeriodo == periodId && m.Valida == 1)
                .ToListAsync();
            
            var studentNiveles = matriculas.Select(m => (int?)m.IdNivel).ToList();
            var studentsDirectNiveles = await _context.Alumnos
                .Where(s => memberCedulas.Contains(s.IdAlumno.Trim()) && s.IdNivel != null)
                .Select(s => new { s.IdAlumno, s.IdNivel })
                .ToListAsync();

            var courses = await _context.Cursos.ToListAsync();

            foreach (var cedula in memberCedulas)
            {
                var sCedula = cedula.Trim();
                var mat = matriculas.FirstOrDefault(m => m.IdAlumno.Trim() == sCedula);
                var direct = studentsDirectNiveles.FirstOrDefault(s => s.IdAlumno.Trim() == sCedula);
                var idNivel = mat?.IdNivel ?? direct?.IdNivel;

                if (idNivel.HasValue)
                {
                    var matchingCursos = courses.Where(c => c.IdNivel == idNivel.Value).ToList();
                    foreach (var curso in matchingCursos)
                    {
                        studentCareers.Add(new AlumnosCarrera
                        {
                            IdAlumno = sCedula,
                            IdCarrera = curso.IdCarrera
                        });
                    }
                }
            }
        }
        var allCarreras = await _context.Carreras.ToListAsync();

        if (group.IdCoordinadorNavigation != null && !string.IsNullOrEmpty(group.IdCoordinadorNavigation.IdSigafi) && !string.IsNullOrEmpty(periodId))
        {
            var coordCedula = group.IdCoordinadorNavigation.IdSigafi.Trim();
            var coordCareers = await _context.ProfesoresCarrerasPeriodos
                .Include(pc => pc.IdCarreraNavigation)
                .Where(pc => pc.IdProfesor.Trim() == coordCedula && pc.IdPeriodo == periodId && pc.EsActivo == 1 && pc.IdCarreraNavigation != null)
                .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                .Distinct()
                .ToListAsync();
            if (coordCareers.Any())
            {
                dto.CarreraCoordinador = string.Join(", ", coordCareers);
            }
        }

        var memberUserIds = group.InvGruposMiembros.Select(m => m.IdUsuario).ToList();
        var membersMetadata = await _context.InvUsuariosMetadata
            .Where(m => memberUserIds.Contains(m.IdUsuario))
            .ToListAsync();

        dto.Miembros = group.InvGruposMiembros.Select(m =>
        {
            var cedula = m.IdUsuarioNavigation?.IdSigafi?.Trim();
            string? carreraNom = null;

            if (!string.IsNullOrEmpty(cedula))
            {
                var tCareers = teacherCareers
                    .Where(pc => pc.IdProfesor.Trim() == cedula && pc.IdCarreraNavigation != null)
                    .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                    .Distinct()
                    .ToList();
                if (tCareers.Any())
                {
                    carreraNom = string.Join(", ", tCareers);
                }
                else
                {
                    var sCareerIds = studentCareers
                        .Where(ac => ac.IdAlumno.Trim() == cedula)
                        .Select(ac => ac.IdCarrera)
                        .ToList();
                    var sCareers = allCarreras
                        .Where(c => sCareerIds.Contains(c.IdCarrera) && !string.IsNullOrEmpty(c.Carrera1))
                        .Select(c => c.Carrera1!)
                        .ToList();
                    if (sCareers.Any())
                    {
                        carreraNom = string.Join(", ", sCareers);
                    }
                }
            }

            var meta = membersMetadata.FirstOrDefault(x => x.IdUsuario == m.IdUsuario);

            return new GroupMemberDto
            {
                IdGrupoMiembro = m.IdGrupoMiembro,
                IdUsuario = m.IdUsuario,
                NombreCompleto = m.IdUsuarioNavigation?.Nombre ?? "Desconocido",
                Cedula = cedula,
                Rol = m.Rol,
                Activo = m.Activo ?? false,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin,
                Carrera = carreraNom,
                TelefonoContacto = !string.IsNullOrEmpty(m.TelefonoContacto)
                    ? m.TelefonoContacto
                    : GetUserPhoneFromCatalog(m.IdUsuarioNavigation?.IdSigafi, m.IdUsuarioNavigation?.TablaSigafi),
                OrcidId = meta?.OrcidId,
                ScopusId = meta?.ScopusId,
                GoogleScholarUrl = meta?.GoogleScholarUrl,
                ResearchGateUrl = meta?.ResearchGateUrl,
                Especialidad = meta?.Especialidad,
                GradoAcademicoMaximo = meta?.GradoAcademicoMaximo
            };
        }).ToList();

        var projects = await _context.InvProyectos
            .Include(p => p.InvProyectoParticipantes)
                .ThenInclude(pp => pp.IdUsuarioNavigation)
            .Where(p => p.IdGrupo == group.IdGrupo && p.Activo == true)
            .ToListAsync();

        dto.Proyectos = projects.Select(p =>
        {
            string? directorName = null;
            var directorProf = p.InvProyectoParticipantes.FirstOrDefault(pp => pp.EsDirector == true);
            if (directorProf != null)
            {
                directorName = directorProf.IdUsuarioNavigation?.Nombre;
            }
            else
            {
                var firstProf = p.InvProyectoParticipantes.FirstOrDefault(pp => pp.TipoParticipante == "Docente");
                if (firstProf != null)
                {
                    directorName = firstProf.IdUsuarioNavigation?.Nombre;
                }
                else
                {
                    var firstStud = p.InvProyectoParticipantes.FirstOrDefault(pp => pp.TipoParticipante == "Alumno");
                    if (firstStud != null)
                    {
                        directorName = firstStud.IdUsuarioNavigation?.Nombre;
                    }
                }
            }

            return new GroupAssociatedProjectDto
            {
                Uuid = p.Uuid,
                Titulo = p.Titulo,
                Estado = p.Estado,
                CodigoInstitucional = p.CodigoInstitucional,
                DirectorNombre = directorName ?? "No asignado"
            };
        }).ToList();

        return dto;
    }

    public async Task<IEnumerable<GroupDto>> GetPublicGroupsAsync(string? search = null)
    {
        var query = _context.InvGruposInvestigacion
            .Include(g => g.IdCoordinadorNavigation)
            .Include(g => g.IdLineas)
            .Include(g => g.IdCarreras)
            .Include(g => g.InvProyectos)
            .Include(g => g.InvGruposMiembros)
                .ThenInclude(m => m.IdUsuarioNavigation)
            .Where(g => g.Estado == "Aprobado" && g.Activo == true && g.Eliminado != true)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(g => g.Nombre.Contains(search) || g.Siglas!.Contains(search));
        }

        var groups = await query.ToListAsync();

        return groups.Select(g => 
        {
            var dto = MapToDto(g);
            dto.LineasIds = g.IdLineas.Select(l => l.IdLinea).ToList();
            dto.CarrerasIds = g.IdCarreras.Select(c => c.IdCarrera).ToList();
            
            dto.Miembros = g.InvGruposMiembros
                .Where(m => m.Activo == true)
                .Select(m => new GroupMemberDto
                {
                    IdGrupoMiembro = m.IdGrupoMiembro,
                    IdUsuario = m.IdUsuario,
                    NombreCompleto = m.IdUsuarioNavigation?.Nombre ?? "Desconocido",
                    Rol = m.Rol,
                    Activo = m.Activo ?? false,
                    FechaInicio = m.FechaInicio,
                    FechaFin = m.FechaFin
                }).ToList();

            dto.Proyectos = g.InvProyectos
                .Where(p => p.Activo == true)
                .Select(p => new GroupAssociatedProjectDto
                {
                    Uuid = p.Uuid,
                    Titulo = p.Titulo,
                    Estado = p.Estado,
                    CodigoInstitucional = p.CodigoInstitucional
                }).ToList();

            dto.TelefonoCoordinador = null;
            dto.LinkWhatsapp = null;
            dto.TeacherMemberCedulas = new List<string>();
            
            return dto;
        }).ToList();
    }

    public async Task<GroupDto?> GetPublicGroupByUuidAsync(string uuid)
    {
        var groupDto = await GetByUuidAsync(uuid);
        if (groupDto == null || groupDto.Estado != "Aprobado" || !groupDto.Activo)
        {
            return null;
        }

        groupDto.TelefonoCoordinador = null;
        groupDto.LinkWhatsapp = null;
        groupDto.TeacherMemberCedulas = new List<string>();
        if (groupDto.Miembros != null)
        {
            foreach (var m in groupDto.Miembros)
            {
                m.Cedula = null;
                m.TelefonoContacto = null;
            }
        }

        return groupDto;
    }
}
