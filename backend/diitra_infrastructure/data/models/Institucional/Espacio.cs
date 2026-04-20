using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Espacio
{
    public int IdEspacio { get; set; }

    public string Codigo { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public string Tipo { get; set; } = null!;

    public int Capacidad { get; set; }

    public int? IdCarrera { get; set; }

    public string? Edificio { get; set; }

    public int Piso { get; set; }

    public sbyte Activo { get; set; }

    public sbyte? RequiereReserva { get; set; }

    public virtual ICollection<HorarioDetalle> HorarioDetalles { get; set; } = new List<HorarioDetalle>();

    public virtual Carrera? IdCarreraNavigation { get; set; }
}
