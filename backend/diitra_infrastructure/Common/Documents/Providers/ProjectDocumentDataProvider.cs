using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace Diitra.Infrastructure.Common.Documents.Providers
{
    public class ProjectDocumentDataProvider : IDocumentDataProvider
    {
        private readonly DiitraContext _db;

        public ProjectDocumentDataProvider(DiitraContext db)
        {
            _db = db;
        }

        public bool CanHandle(string entityType) => entityType == "Proyecto";

        public async Task<object> GetDocumentDataAsync(string entityUuid, CancellationToken ct = default)
        {
            var proyecto = await _db.InvProyectos
                .AsSplitQuery()
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.InvProyectosProfesores).ThenInclude(pp => pp.IdUsuarioNavigation)
                .Include(p => p.InvProyectosAlumnos).ThenInclude(pa => pa.IdUsuarioNavigation)
                .Include(p => p.InvObjetivosProyecto)
                .Include(p => p.InvPresupuestoItems)
                .Include(p => p.InvCronogramas)
                .FirstOrDefaultAsync(p => p.Uuid == entityUuid, ct)
                ?? throw new System.Collections.Generic.KeyNotFoundException($"Proyecto no encontrado: {entityUuid}");

            // Mapeamos a objeto anónimo para Scriban
            return new
            {
                proyecto.Uuid,
                proyecto.Titulo,
                proyecto.CodigoInstitucional,
                proyecto.Estado,
                proyecto.FechaPresentacion,
                Convocatoria = proyecto.IdConvocatoriaNavigation?.Titulo ?? "N/A",
                Director = proyecto.InvProyectosProfesores.FirstOrDefault(p => p.EsDirector == true && p.Activo != false)?.IdUsuarioNavigation?.Nombre ?? "No asignado",
                
                EquipoDocente = proyecto.InvProyectosProfesores.Where(p => p.Activo != false).Select(p => new {
                    Nombre = p.IdUsuarioNavigation?.Nombre ?? "Desconocido",
                    p.Rol,
                    p.HorasSemanales
                }),
                EquipoEstudiantes = proyecto.InvProyectosAlumnos.Where(a => a.Activo != false).Select(a => new {
                    Nombre = a.IdUsuarioNavigation?.Nombre ?? "Desconocido",
                    a.Rol,
                    a.HorasSemanales
                }),
                Objetivos = proyecto.InvObjetivosProyecto.OrderBy(o => o.Orden).Select(o => new {
                    o.Descripcion,
                    Tipo = o.EsGeneral ? "General" : "Específico"
                }),
                Presupuesto = proyecto.InvPresupuestoItems.Select(i => new {
                    i.Categoria,
                    i.Detalle,
                    i.Cantidad,
                    i.ValorUnitario,
                    i.ValorTotal
                }),
                Cronograma = proyecto.InvCronogramas.OrderBy(c => c.NumeroActividad).Select(c => new {
                    c.NumeroActividad,
                    c.Descripcion,
                    c.FechaInicioPrevista,
                    c.FechaFinPrevista,
                    c.Progreso
                })
            };
        }
    }
}
