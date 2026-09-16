using System;
using System.Collections.Generic;
using System.IO;

namespace diitra_application.Feedback.DTOs;

public class FeedbackUploadedFile
{
    public string FileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long Length { get; set; }
    public Stream Stream { get; set; } = null!;
}

public class CreateFeedbackDto
{
    public string Tipo { get; set; } = "SUGERENCIA"; // SUGERENCIA | ERROR | DUDA
    public string Titulo { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public string? RutaOrigen { get; set; }
    public string? MetadataNavegador { get; set; }
    public List<FeedbackUploadedFile>? Archivos { get; set; }
}

public class FeedbackAdjuntoDto
{
    public string NombreOriginal { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string TipoMime { get; set; } = null!;
    public long TamanoBytes { get; set; }
}

public class FeedbackMensajeDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public int? IdUsuario { get; set; }
    public bool EsAdmin { get; set; }
    public string NombreAutor { get; set; } = null!;
    public string RolAutor { get; set; } = null!;
    public string Mensaje { get; set; } = null!;
    public DateTime Fecha { get; set; } = DateTime.Now;
}

public class CreateFeedbackMensajeDto
{
    public string Mensaje { get; set; } = null!;
}

public class FeedbackReporteDto
{
    public int IdFeedback { get; set; }
    public string Uuid { get; set; } = null!;
    public int? IdUsuario { get; set; }
    public string? Cedula { get; set; }
    public string NombreUsuario { get; set; } = null!;
    public string RolUsuario { get; set; } = null!;
    public string Tipo { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public string? RutaOrigen { get; set; }
    public string? MetadataNavegador { get; set; }
    public List<FeedbackAdjuntoDto> Archivos { get; set; } = new();
    public string Estado { get; set; } = null!;
    public string? ObservacionAdmin { get; set; }
    public List<FeedbackMensajeDto> Conversacion { get; set; } = new();
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaActualizacion { get; set; }
}

public class UpdateFeedbackStatusDto
{
    public string Estado { get; set; } = null!; // PENDIENTE | EN_REVISION | ATENDIDO | DESCARTADO
    public string? ObservacionAdmin { get; set; }
}

public class UpdateUserFeedbackDto
{
    public string? Tipo { get; set; }
    public string Titulo { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
}

public class FeedbackSupportConfigDto
{
    public string WhatsAppNumber { get; set; } = null!;
    public long MaxImageSizeBytes { get; set; }
    public long MaxVideoSizeBytes { get; set; }
}
