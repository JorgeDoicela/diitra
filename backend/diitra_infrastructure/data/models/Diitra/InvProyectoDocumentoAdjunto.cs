using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoDocumentoAdjunto
{
    public int IdDocAdj { get; set; }
    public string Uuid { get; set; } = null!;
    public int IdProyecto { get; set; }
    public int? IdDocReq { get; set; }
    public string NombreArchivo { get; set; } = null!;
    public string RutaArchivo { get; set; } = null!;
    public DateTime? FechaSubida { get; set; }

    public virtual InvConvocatoriaDocumentoReq? IdDocReqNavigation { get; set; }
    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}
