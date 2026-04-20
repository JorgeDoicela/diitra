using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvRevision
{
    public int IdRevision { get; set; }
    public int IdProyecto { get; set; }
    public string IdProfesorRevisor { get; set; } = null!;
    public sbyte EsDoubleCiego { get; set; } = 1;
    public string Estado { get; set; } = "pendiente";
    public decimal? PuntajeTotal { get; set; }
    public string? Comentarios { get; set; }
    public DateTime FechaAsignacion { get; set; }
    public DateOnly? FechaLimite { get; set; }
    public DateTime? FechaEntrega { get; set; }
    public sbyte Activo { get; set; } = 1;

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Profesore IdProfesorRevisorNavigation { get; set; } = null!;
    public virtual ICollection<InvRevisionDetalle> Detalles { get; set; } = new List<InvRevisionDetalle>();
}

public partial class InvRubrica
{
    public int IdRubrica { get; set; }
    public string Criterio { get; set; } = null!;
    public string? Descripcion { get; set; }
    public decimal PuntajeMax { get; set; } = 10.00m;
    public int Orden { get; set; }
    public sbyte Activo { get; set; } = 1;

    public virtual ICollection<InvRevisionDetalle> Detalles { get; set; } = new List<InvRevisionDetalle>();
}

public partial class InvRevisionDetalle
{
    public int IdDetalleRevision { get; set; }
    public int IdRevision { get; set; }
    public int IdRubrica { get; set; }
    public decimal Puntaje { get; set; }
    public string? Observacion { get; set; }

    public virtual InvRevision IdRevisionNavigation { get; set; } = null!;
    public virtual InvRubrica IdRubricaNavigation { get; set; } = null!;
}

