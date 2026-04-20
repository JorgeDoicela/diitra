using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoProfesor {
    public int IdProyectoProfesor { get; set; }
    public int IdProyecto { get; set; }
    public string IdProfesor { get; set; } = null!;
    public string Rol { get; set; } = null!;
    public decimal HorasSemanales { get; set; }
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Profesore IdProfesorNavigation { get; set; } = null!;
}

public partial class InvProyectoAlumno {
    public int IdProyectoAlumno { get; set; }
    public int IdProyecto { get; set; }
    public string IdAlumno { get; set; } = null!;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Alumno IdAlumnoNavigation { get; set; } = null!;
}

public partial class InvProyectoHistorial {
    public int IdHistorial { get; set; }
    public int IdProyecto { get; set; }
    public string EstadoNuevo { get; set; } = null!;
    public string UsuarioCambio { get; set; } = null!;
    public DateTime FechaCambio { get; set; }
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}

public partial class InvNotificacion {
    public int IdNotificacion { get; set; }
    public string Destinatario { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string? Mensaje { get; set; }
    public DateTime FechaEnvio { get; set; }
    public sbyte Leido { get; set; }
}

public partial class InvCronogramaTarea {
    public int IdTarea { get; set; }
    public int IdProyecto { get; set; }
    public string NombreTarea { get; set; } = null!;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}

public partial class InvInformeAvance {
    public int IdInforme { get; set; }
    public int IdProyecto { get; set; }
    public string IdProfesor { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string Estado { get; set; } = null!;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Profesore IdProfesorNavigation { get; set; } = null!;
    public virtual ICollection<InvEvidencia> Evidencias { get; set; } = new List<InvEvidencia>();
}

public partial class InvEvidencia {
    public int IdEvidencia { get; set; }
    public int IdInforme { get; set; }
    public string NombreArchivo { get; set; } = null!;
    public string RutaArchivo { get; set; } = null!;
    public string TipoEvidencia { get; set; } = null!;
    public virtual InvInformeAvance IdInformeNavigation { get; set; } = null!;
}

public partial class InvPresupuestoItem {
    public int IdItem { get; set; }
    public int IdProyecto { get; set; }
    public string Categoria { get; set; } = null!;
    public string? Descripcion { get; set; }
    public decimal Cantidad { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual ICollection<InvGasto> Gastos { get; set; } = new List<InvGasto>();
}

public partial class InvGasto {
    public int IdGasto { get; set; }
    public int IdProyecto { get; set; }
    public int IdItem { get; set; }
    public decimal Monto { get; set; }
    public string RegistradoPor { get; set; } = null!;
    public DateTime FechaGasto { get; set; }
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvPresupuestoItem IdItemNavigation { get; set; } = null!;
    public virtual Profesore RegistradoPorNavigation { get; set; } = null!;
}

public partial class InvProducto {
    public int IdProducto { get; set; }
    public int IdProyecto { get; set; }
    public string Titulo { get; set; } = null!;
    public string? IssnIsbn { get; set; }
    public string? EnlaceUrl { get; set; }
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}

public partial class InvTransferencia {
    public int IdTransferencia { get; set; }
    public int IdProyecto { get; set; }
    public string EmpresaBeneficiaria { get; set; } = null!;
    public decimal ValorConvenio { get; set; }
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}



