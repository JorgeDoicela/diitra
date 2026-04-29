using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SISTEMA] Registro de Transferencia Tecnológica y Convenios Interinstitucionales
/// </summary>
public partial class InvTransferencia
{
    public int IdTransferencia { get; set; }
    public int IdProyecto { get; set; }
    public string EntidadReceptora { get; set; } = null!;
    public string? NumeroConvenio { get; set; }
    public DateOnly? FechaConvenio { get; set; }
    public string? Descripcion { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}
