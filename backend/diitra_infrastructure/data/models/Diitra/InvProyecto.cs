using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyecto
{
    public int IdProyecto { get; set; }
    public string Uuid { get; set; } = null!;
    public int? IdConvocatoria { get; set; }
    public string? CodigoInstitucional { get; set; }
    public string Titulo { get; set; } = null!;
    public string? DescripcionProyecto { get; set; }
    public string? Antecedentes { get; set; }
    public string? Justificacion { get; set; }
    public string? MarcoTeorico { get; set; }
    public string? Metodologia { get; set; }
    public string? MetodoEvaluacion { get; set; }
    public int? IdSublinea { get; set; }
    public int? IdPrograma { get; set; }
    public int? IdGrupo { get; set; }
    public bool? TieneGrupo { get; set; }
    public int? IdTipo { get; set; }
    public DateOnly? FechaPresentacion { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public string? TiempoEjecucion { get; set; }
    public string Estado { get; set; } = "Borrador";
    public decimal? PuntajeEvaluacion { get; set; }
    public decimal? ValorEjecucion { get; set; }
    public string? IdDspaceHandle { get; set; }
    public string? MetadataCacesJson { get; set; }
    public bool? Activo { get; set; }
    public DateTime? FechaRegistro { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public int? IdObjetivoPnd { get; set; }

    // NÚCLEO DE INNOVACIÓN Y VINCULACIÓN PRODUCTIVA
    public int? IdEntidadAliada { get; set; }
    public sbyte? TrlInicial { get; set; }
    public sbyte? TrlActual { get; set; }
    public sbyte? TrlMeta { get; set; }

    public virtual InvConvocatoria? IdConvocatoriaNavigation { get; set; }
    public virtual InvSublinea? IdSublineaNavigation { get; set; }
    public virtual InvPrograma? IdProgramaNavigation { get; set; }
    public virtual InvGrupoInvestigacion? IdGrupoNavigation { get; set; }
    public virtual InvTipoInvestigacion? IdTipoNavigation { get; set; }
    public virtual InvPndObjetivo? IdObjetivoPndNavigation { get; set; }
    public virtual InvEntidadExterna? IdEntidadAliadaNavigation { get; set; }

    public virtual ICollection<InvProyectoCarrera> InvProyectosCarreras { get; set; } = new List<InvProyectoCarrera>();
    public virtual ICollection<InvProyectoDominio> InvProyectosDominios { get; set; } = new List<InvProyectoDominio>();
    public virtual ICollection<InvProyectoProfesor> InvProyectosProfesores { get; set; } = new List<InvProyectoProfesor>();
    public virtual ICollection<InvProyectoAlumno> InvProyectosAlumnos { get; set; } = new List<InvProyectoAlumno>();
    public virtual ICollection<InvObjetivoProyecto> InvObjetivosProyecto { get; set; } = new List<InvObjetivoProyecto>();
    public virtual ICollection<InvProyectoOds> InvProyectosOds { get; set; } = new List<InvProyectoOds>();
    public virtual ICollection<InvRecursoDisponible> InvRecursosDisponibles { get; set; } = new List<InvRecursoDisponible>();
    public virtual ICollection<InvPresupuestoItem> InvPresupuestoItems { get; set; } = new List<InvPresupuestoItem>();
    public virtual ICollection<InvFinanciamiento> InvFinanciamientos { get; set; } = new List<InvFinanciamiento>();
    public virtual ICollection<InvProducto> InvProductos { get; set; } = new List<InvProducto>();
    public virtual ICollection<InvImpactoProyecto> InvImpactosProyecto { get; set; } = new List<InvImpactoProyecto>();
    public virtual ICollection<InvCronograma> InvCronogramas { get; set; } = new List<InvCronograma>();
    public virtual ICollection<InvBibliografiaProyecto> InvBibliografiasProyecto { get; set; } = new List<InvBibliografiaProyecto>();
    public virtual ICollection<InvInformeAvance> InvInformesAvance { get; set; } = new List<InvInformeAvance>();
    public virtual ICollection<InvGasto> InvGastos { get; set; } = new List<InvGasto>();
    public virtual ICollection<InvTransferencia> InvTransferencias { get; set; } = new List<InvTransferencia>();

    public virtual ICollection<InvProyectoMml> MatrizMarcoLogico { get; set; } = new List<InvProyectoMml>();

    public virtual ICollection<InvProyectoDocumentoAdjunto> DocumentosAdjuntos { get; set; } = new List<InvProyectoDocumentoAdjunto>();
}
