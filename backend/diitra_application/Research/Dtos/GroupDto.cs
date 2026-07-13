using System;
using System.Collections.Generic;

namespace diitra_application.Research.Dtos;

public class GroupDto
{
    public int IdGrupo { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Siglas { get; set; }
    public string TipoGrupo { get; set; } = "Investigación";
    public int? IdDominio { get; set; }
    public int? IdCoordinador { get; set; }
    public string? IdProfesorCoordinador { get; set; }
    public string? NombreCoordinador { get; set; }
    public string? CarreraCoordinador { get; set; }
    public string? ObjetivoGeneral { get; set; }
    public string? Mision { get; set; }
    public string? Vision { get; set; }
    public string? ResolucionAprobacion { get; set; }
    public DateOnly? FechaCreacion { get; set; }
    public string? CategoriaConsolidacion { get; set; }
    public bool Activo { get; set; }
    public string? Estado { get; set; }
    public string? LinkWhatsapp { get; set; }
    public string? TelefonoCoordinador { get; set; }
    public string? FotoUrl { get; set; }

    public List<int> LineasIds { get; set; } = new();
    public List<int> CarrerasIds { get; set; } = new();
    public List<string> LineasNombres { get; set; } = new();
    public List<string> CarrerasNombres { get; set; } = new();
    public List<GroupMemberDto> Miembros { get; set; } = new();
    public List<GroupAssociatedProjectDto> Proyectos { get; set; } = new();
    public List<string> TeacherMemberCedulas { get; set; } = new();
}

public class GroupAssociatedProjectDto
{
    public string Uuid { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string Estado { get; set; } = null!;
    public string? CodigoInstitucional { get; set; }
    public string? DirectorNombre { get; set; }
}

public class GroupMemberDto
{
    public int IdGrupoMiembro { get; set; }
    public int IdUsuario { get; set; }
    public string? NombreCompleto { get; set; }
    public string? Cedula { get; set; }
    public string? Rol { get; set; }
    public bool Activo { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public string? Carrera { get; set; }
    public string? TelefonoContacto { get; set; }
    public string? OrcidId { get; set; }
    public string? ScopusId { get; set; }
    public string? GoogleScholarUrl { get; set; }
    public string? ResearchGateUrl { get; set; }
    public string? Especialidad { get; set; }
    public string? GradoAcademicoMaximo { get; set; }
}

public class CreateGroupDto
{
    public string Nombre { get; set; } = null!;
    public string? Siglas { get; set; }
    public string TipoGrupo { get; set; } = "Investigación";
    public int? IdDominio { get; set; }
    public int? IdCoordinador { get; set; }
    public string? IdProfesorCoordinador { get; set; }
    public string? ObjetivoGeneral { get; set; }
    public string? Mision { get; set; }
    public string? Vision { get; set; }
    public string? ResolucionAprobacion { get; set; }
    public string? Estado { get; set; }
    public DateOnly? FechaCreacion { get; set; }
    public string? CategoriaConsolidacion { get; set; }
    public string? LinkWhatsapp { get; set; }
    public string? TelefonoCoordinador { get; set; }
    public string? FotoUrl { get; set; }
    public List<int> LineasIds { get; set; } = new();
    public List<int> CarrerasIds { get; set; } = new();
    public List<GroupMemberDto> Miembros { get; set; } = new();
}
