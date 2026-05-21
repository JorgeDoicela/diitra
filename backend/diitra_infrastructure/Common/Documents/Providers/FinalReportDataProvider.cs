using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace Diitra.Infrastructure.Common.Documents.Providers
{
    /// <summary>
    /// Proveedor de Datos para el Informe Final de Investigación.
    /// Consolida toda la trazabilidad del proyecto: Planificación inicial vs Ejecución real.
    /// </summary>
    public class FinalReportDataProvider : IDocumentDataProvider
    {
        private readonly DiitraContext _db;

        public FinalReportDataProvider(DiitraContext db)
        {
            _db = db;
        }

        public bool CanHandle(string entityType) => entityType == "INFORME_FINAL_INVESTIGACION" || entityType == "InformeFinal";

        public async Task<object> GetDocumentDataAsync(string entityUuid, CancellationToken ct = default)
        {
            // En este caso, entityUuid es el Uuid del PROYECTO al que pertenece el informe
            var proyecto = await _db.InvProyectos
                .Include(p => p.InvProyectosProfesores).ThenInclude(pp => pp.IdUsuarioNavigation)
                .Include(p => p.InvObjetivosProyecto)
                .Include(p => p.InvPresupuestoItems)
                .Include(p => p.InvCronogramas)
                .Include(p => p.InvGastos)
                .Include(p => p.InvProductos)
                .FirstOrDefaultAsync(p => p.Uuid == entityUuid, ct)
                ?? throw new System.Collections.Generic.KeyNotFoundException($"Proyecto no encontrado para el informe: {entityUuid}");

            // Cálculos de Consolidación Presupuestaria
            decimal planificado = proyecto.InvPresupuestoItems.Sum(i => i.ValorTotal);
            decimal ejecutado = proyecto.InvGastos.Sum(g => g.Monto);
            
            // Cálculos de Avance
            double progresoPromedio = proyecto.InvCronogramas.Any() 
                ? (double)proyecto.InvCronogramas.Average(c => c.Progreso) 
                : 0;

            var director = proyecto.InvProyectosProfesores.FirstOrDefault(p => p.EsDirector == true && p.Activo != false);

            return new
            {
                Titulo = proyecto.Titulo,
                Codigo = proyecto.CodigoInstitucional,
                FechaInicio = proyecto.FechaInicio?.ToString("dd/MM/yyyy") ?? "N/A",
                FechaFin = proyecto.FechaFin?.ToString("dd/MM/yyyy") ?? "N/A",
                LineaInvestigacion = "Línea de Prueba Institutional", // TODO: Link with actual line name
                
                NombreDirector = director?.IdUsuarioNavigation?.Nombre ?? "DIRECTOR NO ASIGNADO",
                CedulaDirector = director?.IdUsuarioNavigation?.IdSigafi ?? "__________",
                
                CumplimientoCronograma = (int)progresoPromedio,
                TrlAlcanzado = proyecto.TrlActual ?? 1,
                ProductosGenerados = proyecto.InvProductos.Count(),

                // Datos Presupuestarios Consolidados
                PresupuestoPlanificado = planificado,
                PresupuestoEjecutado = ejecutado,
                PresupuestoDiferencia = planificado - ejecutado,
                
                ContrapartePlanificada = 0, // Por ahora 0, integrar con contrapartes externas si aplica
                ContraparteEjecutada = 0,
                ContraparteDiferencia = 0,
                
                TotalPlanificado = planificado,
                TotalEjecutado = ejecutado,
                TotalDiferencia = planificado - ejecutado,

                // Trazabilidad de Objetivos
                Objetivos = proyecto.InvObjetivosProyecto.OrderBy(o => o.Orden).Select(o => new {
                    o.Descripcion,
                    EsGeneral = o.EsGeneral
                })
            };
        }
    }
}
