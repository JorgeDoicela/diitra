using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvConvocatoria
{
    public int IdConvocatoria { get; set; }
    public string Uuid { get; set; } = null!;
    public string CodigoConvocatoria { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string IdPeriodo { get; set; } = null!;
    public DateOnly FechaApertura { get; set; }
    public DateOnly FechaCierre { get; set; }
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
    public string Estado { get; set; } = "Borrador";

    public virtual Periodo IdPeriodoNavigation { get; set; } = null!;
    public virtual InvRubrica? IdRubricaNavigation { get; set; }
    public virtual ICollection<InvProyecto> Proyectos { get; set; } = new List<InvProyecto>();
    public virtual ICollection<InvLineaInvestigacion> Lineas { get; set; } = new List<InvLineaInvestigacion>();

    public virtual ICollection<InvConvocatoriaHito> Hitos { get; set; } = new List<InvConvocatoriaHito>();

    public virtual ICollection<InvConvocatoriaDocumentoReq> DocumentosReq { get; set; } = new List<InvConvocatoriaDocumentoReq>();
}
