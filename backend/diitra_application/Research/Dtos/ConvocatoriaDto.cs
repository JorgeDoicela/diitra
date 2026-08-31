using System;
using System.Collections.Generic;

namespace diitra_application.Research.Dtos;

public class ConvocatoriaDto
{
    public int IdConvocatoria { get; set; }
    public string Uuid { get; set; } = null!;
    public string CodigoConvocatoria { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string IdPeriodo { get; set; } = null!;
    public string? PeriodoNombre { get; set; }
    public string Anio { get; set; } = null!;
    public int? IdTipoConvocatoria { get; set; }
    public DateOnly FechaApertura { get; set; }
    public DateOnly FechaCierre { get; set; }
    public string Estado { get; set; } = "Borrador";
    public List<ConvocatoriaProyectoDto> Proyectos { get; set; } = new();
}

public class ConvocatoriaProyectoDto
{
    public string Uuid { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string? CodigoInstitucional { get; set; }
    public string Estado { get; set; } = null!;
}

public class PeriodoDto
{
    public string IdPeriodo { get; set; } = null!;
    public string? Detalle { get; set; }
    public bool Activo { get; set; }
}

public class CreateConvocatoriaDto
{
    public string CodigoConvocatoria { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string IdPeriodo { get; set; } = null!;
    public string Anio { get; set; } = null!;
    public int? IdTipoConvocatoria { get; set; }
    public DateOnly FechaApertura { get; set; }
    public DateOnly FechaCierre { get; set; }
}

public class PublishConvocatoriaRequest
{
    public List<int> DestinatariosUserIds { get; set; } = new();
    public List<string> DestinatariosEmails { get; set; } = new();
    public bool IncluirDocentesConHoras { get; set; }
    public bool IncluirAutoridadesYDepartamentos { get; set; }
    public bool IncluirTodosDocentes { get; set; }
}
