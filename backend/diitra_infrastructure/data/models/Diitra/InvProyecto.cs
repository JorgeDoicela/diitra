using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>Proyecto de Investigación e Innovación</summary>
public partial class InvProyecto
{
    public int IdProyecto { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdConvocatoria { get; set; }
    public string? CodigoInstitucional { get; set; }
    public string Titulo { get; set; } = null!;
    public string? Resumen { get; set; }
    public string? Justificacion { get; set; }
    public string? Metodologia { get; set; }
    public int? IdCampoDetalladoUnesco { get; set; }
    public int? IdEspacio { get; set; }
    public string IdProfesorDirector { get; set; } = null!;
    public string Estado { get; set; } = "borrador";
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public decimal PresupuestoSolicitado { get; set; }
    public decimal PresupuestoAprobado { get; set; }
    public decimal? PuntajeEvaluacion { get; set; }
    public sbyte EsAnonimizado { get; set; }
    public string? RutaProtocolo { get; set; }
    public string? RutaCronograma { get; set; }

    public string? RutaResolucion { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime FechaModificacion { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;

    // Navegación hacia tablas de SIGAFI
    public virtual InvConvocatoria IdConvocatoriaNavigation { get; set; } = null!;
    public virtual Profesore IdProfesorDirectorNavigation { get; set; } = null!;
    public virtual CampoDetalladoUnesco? IdCampoDetalladoUnescoNavigation { get; set; }
    public virtual Espacio? IdEspacioNavigation { get; set; }

    // Navegación hacia tablas nuevas Diitra
    public virtual ICollection<InvProyectoProfesor> Profesores { get; set; } = new List<InvProyectoProfesor>();
    public virtual ICollection<InvProyectoAlumno> Alumnos { get; set; } = new List<InvProyectoAlumno>();
    public virtual ICollection<InvRevision> Revisiones { get; set; } = new List<InvRevision>();
    public virtual ICollection<InvCronogramaTarea> Cronograma { get; set; } = new List<InvCronogramaTarea>();
    public virtual ICollection<InvInformeAvance> Informes { get; set; } = new List<InvInformeAvance>();
    public virtual ICollection<InvPresupuestoItem> PresupuestoItems { get; set; } = new List<InvPresupuestoItem>();
    public virtual ICollection<InvGasto> Gastos { get; set; } = new List<InvGasto>();
    public virtual ICollection<InvProducto> Productos { get; set; } = new List<InvProducto>();
    public virtual ICollection<InvTransferencia> Transferencias { get; set; } = new List<InvTransferencia>();
    public virtual ICollection<InvProyectoHistorial> Historial { get; set; } = new List<InvProyectoHistorial>();
    public virtual ICollection<InvNotificacion> Notificaciones { get; set; } = new List<InvNotificacion>();
}
