using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class HorarioDetalle
{
    public int IdHorario { get; set; }

    public int IdAsignacion { get; set; }

    public int IdEspacio { get; set; }

    public int DiaSemana { get; set; }

    public TimeOnly HoraInicio { get; set; }

    public TimeOnly? HoraFin { get; set; }

    public string? TipoBloque { get; set; }

    public sbyte? Activo { get; set; }

    public virtual AsignacionesProfesore IdAsignacionNavigation { get; set; } = null!;

    public virtual Espacio IdEspacioNavigation { get; set; } = null!;
}
