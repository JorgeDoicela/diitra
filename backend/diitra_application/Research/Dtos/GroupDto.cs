using System;
using System.Collections.Generic;

namespace diitra_application.Research.Dtos;

public class GroupDto
{
    public int IdGrupo { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Siglas { get; set; }
    public string? IdCoordinador { get; set; }
    public string? NombreCoordinador { get; set; }
    public string? ObjetivoGeneral { get; set; }
    public string? Mision { get; set; }
    public string? Vision { get; set; }
    public string? ResolucionAprobacion { get; set; }
    public DateOnly? FechaCreacion { get; set; }
    public bool Activo { get; set; }
    
    public List<int> LineasIds { get; set; } = new();
    public List<GroupMemberDto> Miembros { get; set; } = new();
}

public class GroupMemberDto
{
    public int IdGrupoMiembro { get; set; }
    public string? IdProfesor { get; set; }
    public string? IdAlumno { get; set; }
    public string? NombreCompleto { get; set; }
    public string? Rol { get; set; }
    public bool Activo { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
}

public class CreateGroupDto
{
    public string Nombre { get; set; } = null!;
    public string? Siglas { get; set; }
    public string? IdCoordinador { get; set; }
    public string? ObjetivoGeneral { get; set; }
    public string? Mision { get; set; }
    public string? Vision { get; set; }
    public string? ResolucionAprobacion { get; set; }
    public DateOnly? FechaCreacion { get; set; }
    public List<int> LineasIds { get; set; } = new();
}
