using System;
using System.Collections.Generic;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [MÓVIL] Almacén de tokens para Push Notifications (FCM)
/// </summary>
public partial class InvDispositivoToken
{
    public int IdToken { get; set; }

    public int IdUsuario { get; set; }

    public string DeviceToken { get; set; } = null!;

    public string? Plataforma { get; set; }

    public DateTime? UltimaSincronizacion { get; set; }

    public virtual User IdUsuarioNavigation { get; set; } = null!;
}
