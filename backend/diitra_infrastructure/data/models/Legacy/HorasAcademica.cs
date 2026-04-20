using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class HorasAcademica
{
    public int IdHorasAcademicas { get; set; }

    public int IdDedicacion { get; set; }

    public int? HorasMinimas { get; set; }

    public int? HorasMaximas { get; set; }

    public int? HorasMaximaSemana { get; set; }

    public sbyte? EsActivo { get; set; }

    public virtual Dedicacion IdDedicacionNavigation { get; set; } = null!;
}
