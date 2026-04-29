using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SISTEMA] Desglose semanal del cronograma (Sección 7 del formulario V3)
/// </summary>
public partial class InvCronogramaSemana
{
    public int IdSemana { get; set; }
    public int IdActividad { get; set; }
    public string Mes { get; set; } = null!;
    public bool Semana { get; set; } // En el SQL es TINYINT(1), tratamos como bool si es solo check
    // Nota: El SQL dice "semana TINYINT(1)", pero usualmente es el número de semana. 
    // Sin embargo, si es un checkbox para la vista de Gantt, bool está bien.
    // Revisando SQL: "semana TINYINT(1) NOT NULL"
    public bool Completada { get; set; } = false;

    public virtual InvCronograma IdActividadNavigation { get; set; } = null!;
}
