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
    public int Anio { get; set; }
    public string? Descripcion { get; set; }
    public decimal? PresupuestoTotal { get; set; }
    public decimal? MontoMaximoProyecto { get; set; }
    public string? UrlBases { get; set; }
    public string? RequisitosMinimos { get; set; }
    public int? IdTipoConvocatoria { get; set; }
    public int? IdAgendaZonal { get; set; }
    public int? IdRubrica { get; set; }
    public string? RubricaNombre { get; set; }
    public decimal PuntajeMinimoAprobacion { get; set; } = 70.00m;
    public bool FinanciamientoExt { get; set; }
    public string? MetaProduccion { get; set; }
    public List<int> LineasIds { get; set; } = new();
    public List<ConvocatoriaHitoDto> Hitos { get; set; } = new();
    public List<ConvocatoriaDocumentoReqDto> DocumentosReq { get; set; } = new();
    public DateOnly FechaApertura { get; set; }
    public DateOnly FechaCierre { get; set; }
    public string Estado { get; set; } = "Borrador";
}

public class ConvocatoriaHitoDto
{
    public string? Uuid { get; set; }
    public string NombreHito { get; set; } = null!;
    public DateOnly FechaHito { get; set; }
    public bool EsCritico { get; set; }
    public string? Descripcion { get; set; }
}

public class ConvocatoriaDocumentoReqDto
{
    public string? Uuid { get; set; }
    public string NombreDocumento { get; set; } = null!;
    public string? Descripcion { get; set; }
    public bool EsObligatorio { get; set; }
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
    public int Anio { get; set; }
    public string? Descripcion { get; set; }
    public decimal? PresupuestoTotal { get; set; }
    public decimal? MontoMaximoProyecto { get; set; }
    public string? UrlBases { get; set; }
    public string? RequisitosMinimos { get; set; }
    public int? IdTipoConvocatoria { get; set; }
    public int? IdAgendaZonal { get; set; }
    public int? IdRubrica { get; set; }
    public decimal PuntajeMinimoAprobacion { get; set; } = 70.00m;
    public bool FinanciamientoExt { get; set; }
    public string? MetaProduccion { get; set; }
    public List<int> LineasIds { get; set; } = new();
    public List<ConvocatoriaHitoDto> Hitos { get; set; } = new();
    public List<ConvocatoriaDocumentoReqDto> DocumentosReq { get; set; } = new();
    public DateOnly FechaApertura { get; set; }
    public DateOnly FechaCierre { get; set; }
}
