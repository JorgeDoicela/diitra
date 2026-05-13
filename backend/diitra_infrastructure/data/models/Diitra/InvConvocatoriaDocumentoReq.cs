using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvConvocatoriaDocumentoReq
{
    public int IdDocReq { get; set; }
    public string Uuid { get; set; } = null!;
    public int IdConvocatoria { get; set; }
    public string NombreDocumento { get; set; } = null!;
    public string? Descripcion { get; set; }
    public bool? EsObligatorio { get; set; }
    public string? FormatoAceptado { get; set; }

    public virtual InvConvocatoria IdConvocatoriaNavigation { get; set; } = null!;
    public virtual ICollection<InvProyectoDocumentoAdjunto> InvProyectoDocumentosAdjuntos { get; set; } = new List<InvProyectoDocumentoAdjunto>();
}
