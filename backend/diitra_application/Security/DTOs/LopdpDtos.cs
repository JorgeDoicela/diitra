using System;

namespace diitra_application.Security.DTOs;

public class RegistrarConsentimientoRequest
{
    public string VersionPolitica { get; set; } = null!;
}

public class SolicitudArcoRequest
{
    public string TipoSolicitud { get; set; } = null!; // Acceso, Rectificacion, Eliminacion, Oposicion, Portabilidad, Limitacion
    public string DetalleSolicitud { get; set; } = null!;
}

public class ResolverSolicitudArcoRequest
{
    public int IdSolicitudArco { get; set; }
    public string ResolucionDetalle { get; set; } = null!;
    public string Estado { get; set; } = null!; // Aprobado, Rechazado
    public string? DocumentoResolucionPath { get; set; }
}

public class SolicitudArcoResponse
{
    public int IdSolicitudArco { get; set; }
    public Guid Uuid { get; set; }
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = null!;
    public string TipoSolicitud { get; set; } = null!;
    public string DetalleSolicitud { get; set; } = null!;
    public DateTime FechaSolicitud { get; set; }
    public DateOnly FechaLimiteResolucion { get; set; }
    public string Estado { get; set; } = null!;
    public string? ResolucionDetalle { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public string? DocumentoResolucionPath { get; set; }
}

public class PerfilLopdpDto
{
    public string? OrcidId { get; set; }
    public string? ScopusId { get; set; }
    public string? GoogleScholarUrl { get; set; }
    public string? ResearchGateUrl { get; set; }
    public string? Especialidad { get; set; }
    public string? GradoAcademicoMaximo { get; set; }
    public bool AceptoTerminosFirma { get; set; }
    public DateTime? FechaConsentimientoFirma { get; set; }
    public bool HasP12Certificate { get; set; }
}

public class ActualizarPerfilRequest
{
    public string? OrcidId { get; set; }
    public string? ScopusId { get; set; }
    public string? GoogleScholarUrl { get; set; }
    public string? ResearchGateUrl { get; set; }
    public string? Especialidad { get; set; }
    public string? GradoAcademicoMaximo { get; set; }
}

public class ConsentimientoResponse
{
    public int IdConsentimiento { get; set; }
    public Guid Uuid { get; set; }
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = null!;
    public string VersionPolitica { get; set; } = null!;
    public string Canal { get; set; } = null!;
    public DateTime FechaConsentimiento { get; set; }
    public string? IpDireccion { get; set; }
    public string? UserAgent { get; set; }
    public string Estado { get; set; } = null!;
}


