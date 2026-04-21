using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoProfesor {
    public int IdProyectoProfesor { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public string IdProfesor { get; set; } = null!;
    public string Rol { get; set; } = null!;
    public decimal HorasSemanales { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Profesore IdProfesorNavigation { get; set; } = null!;
}

public partial class InvProyectoAlumno {
    public int IdProyectoAlumno { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public string IdAlumno { get; set; } = null!;
    public string Rol { get; set; } = "Investigador Auxiliar";
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Alumno IdAlumnoNavigation { get; set; } = null!;
}

public partial class InvProyectoHistorial {
    public int IdHistorial { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public string? EstadoAnterior { get; set; }
    public string EstadoNuevo { get; set; } = null!;
    public string? Comentario { get; set; }
    public string UsuarioCambio { get; set; } = null!;
    public DateTime FechaCambio { get; set; } = DateTime.UtcNow;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}

public partial class InvNotificacion {
    public int IdNotificacion { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int? IdProyecto { get; set; }
    public string Destinatario { get; set; } = null!;
    public string TipoDestinatario { get; set; } = "profesor";
    public string Tipo { get; set; } = "otro";
    public string Titulo { get; set; } = null!;
    public string? Mensaje { get; set; }
    public sbyte Leido { get; set; } = 0;
    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;
    public DateTime? FechaLectura { get; set; }
    public int Version { get; set; } = 1;
}

public partial class InvCronogramaTarea {
    public int IdTarea { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public string NombreTarea { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public sbyte PorcentajeAvance { get; set; } = 0;
    public sbyte EsHito { get; set; } = 0;
    public int Orden { get; set; } = 0;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}

public partial class InvInformeAvance {
    public int IdInforme { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public string IdProfesor { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }
    public sbyte PorcentajeAvance { get; set; } = 0;
    public string? PeriodoReporte { get; set; }
    public string? RutaArchivo { get; set; }
    public string Estado { get; set; } = "borrador";
    public string? ObservacionDirector { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime FechaModificacion { get; set; } = DateTime.UtcNow;
    public DateOnly? FechaEntrega { get; set; }
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Profesore IdProfesorNavigation { get; set; } = null!;
    public virtual ICollection<InvEvidencia> Evidencias { get; set; } = new List<InvEvidencia>();
}

public partial class InvEvidencia {
    public int IdEvidencia { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdInforme { get; set; }
    public string NombreArchivo { get; set; } = null!;
    public string RutaArchivo { get; set; } = null!;
    public string TipoEvidencia { get; set; } = "otro";
    public string? MimeType { get; set; }
    public int? TamanioBytes { get; set; }
    public string? Descripcion { get; set; }
    public DateTime FechaSubida { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public virtual InvInformeAvance IdInformeNavigation { get; set; } = null!;
}

public partial class InvPresupuestoItem {
    public int IdItem { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public string Categoria { get; set; } = "otro";
    public string? Descripcion { get; set; }
    public decimal Cantidad { get; set; } = 1.00m;
    public decimal ValorUnitario { get; set; } = 0.00m;
    public decimal ValorTotal { get; set; } = 0.00m;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual ICollection<InvGasto> Gastos { get; set; } = new List<InvGasto>();
}

public partial class InvGasto {
    public int IdGasto { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public int? IdItem { get; set; }
    public string Descripcion { get; set; } = null!;
    public decimal Monto { get; set; } = 0.00m;
    public DateTime FechaGasto { get; set; }
    public string? NumeroFactura { get; set; }
    public string? RutaFactura { get; set; }
    public string RegistradoPor { get; set; } = null!;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvPresupuestoItem? IdItemNavigation { get; set; }
    public virtual Profesore RegistradoPorNavigation { get; set; } = null!;
}

public partial class InvProducto {
    public int IdProducto { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public string Tipo { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string? Autores { get; set; }
    public string? IssnIsbn { get; set; }
    public string? UrlPublicacion { get; set; }
    public string? NombreRevista { get; set; }
    public string? Indice { get; set; }
    public DateOnly? FechaPublicacion { get; set; }
    public string? RutaArchivo { get; set; }
    public string? NumeroRegistro { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}

public partial class InvTransferencia {
    public int IdTransferencia { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public string EmpresaBeneficiaria { get; set; } = null!;
    public string TipoTransferencia { get; set; } = "otro";
    public string? Descripcion { get; set; }
    public decimal ValorConvenio { get; set; } = 0.00m;
    public DateOnly? FechaConvenio { get; set; }
    public string? RutaConvenio { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}
