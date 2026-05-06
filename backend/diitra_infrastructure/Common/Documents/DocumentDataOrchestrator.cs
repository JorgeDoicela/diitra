using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace Diitra.Infrastructure.Common.Documents
{
    /// <summary>
    /// Implementación Realista y Enterprise del Orquestador de Datos.
    /// Resuelve el problema de la "Ceguera de Datos" del Builder.
    /// </summary>
    public class DocumentDataOrchestrator : IDocumentDataOrchestrator
    {
        private readonly DiitraContext _db;

        public DocumentDataOrchestrator(DiitraContext db)
        {
            _db = db;
        }

        public async Task<DocumentRequest> PrepareRequestAsync(string documentInstanceUuid, string requestedBy, CancellationToken ct = default)
        {
            // 1. Obtener la instancia del documento
            var instance = await _db.DocumentInstances
                .FirstOrDefaultAsync(i => i.Uuid == documentInstanceUuid, ct)
                ?? throw new KeyNotFoundException($"No se encontró la instancia de documento: {documentInstanceUuid}");

            // 2. Obtener el Proyecto asociado (Entidad Padre)
            var proyecto = await _db.InvProyectos
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.InvProyectosProfesores).ThenInclude(pp => pp.IdProfesorNavigation)
                .Include(p => p.InvProyectosAlumnos).ThenInclude(pa => pa.IdAlumnoNavigation)
                .Include(p => p.InvObjetivosProyecto)
                .Include(p => p.InvPresupuestoItems)
                .Include(p => p.InvCronograma)
                .FirstOrDefaultAsync(p => p.Uuid == instance.EntityUuid, ct)
                ?? throw new KeyNotFoundException($"El documento {documentInstanceUuid} no tiene un Proyecto válido asociado.");

            // 3. Obtener el contenido colaborativo de CoWork para este proyecto
            // El Builder necesita el HTML resultante de la edición colaborativa.
            var coworkDocs = await _db.InvCoworkDocumentos
                .Where(d => d.EntidadUuid == proyecto.Uuid)
                .ToListAsync(ct);

            // Mapeamos los campos de CoWork a un diccionario de contenido
            // Ej: { "antecedentes": "<html>...", "metodologia": "<html>..." }
            var collaborativeContent = coworkDocs.ToDictionary(
                d => d.CampoNombre, 
                d => d.ContentHtml ?? "<p class='empty-field'>[Sección no redactada]</p>"
            );

            // 4. Construir el DTO Maestro que se pasará a Scriban
            // Este objeto es lo que el diseñador de plantillas verá como 'data'
            var masterData = new
            {
                Proyecto = new
                {
                    proyecto.Uuid,
                    proyecto.Titulo,
                    proyecto.CodigoInstitucional,
                    proyecto.Estado,
                    proyecto.FechaPresentacion,
                    Convocatoria = proyecto.IdConvocatoriaNavigation?.Titulo ?? "N/A",
                    Director = proyecto.InvProyectosProfesores.FirstOrDefault(p => p.EsDirector)?.IdProfesorNavigation?.PrimerApellido ?? "No asignado",
                    
                    // Listas para tablas en el PDF
                    EquipoDocente = proyecto.InvProyectosProfesores.Select(p => new {
                        Nombre = $"{p.IdProfesorNavigation.PrimerNombre} {p.IdProfesorNavigation.PrimerApellido}",
                        p.Rol,
                        p.HorasSemanales
                    }),
                    EquipoEstudiantes = proyecto.InvProyectosAlumnos.Select(a => new {
                        Nombre = $"{a.IdAlumnoNavigation.PrimerNombre} {a.IdAlumnoNavigation.ApellidoPaterno}",
                        a.Rol
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
                    Cronograma = proyecto.InvCronograma.OrderBy(c => c.NumeroActividad).Select(c => new {
                        c.NumeroActividad,
                        c.Descripcion,
                        c.FechaInicioPrevista,
                        c.FechaFinPrevista,
                        c.Progreso
                    })
                },
                // Aquí inyectamos el contenido que viene de CoWork
                ContenidoColaborativo = collaborativeContent,
                
                // Metadatos del sistema
                Emision = new
                {
                    Fecha = DateTime.Now.ToString("dd/MM/yyyy HH:mm"),
                    Usuario = requestedBy,
                    SelloDigital = Guid.NewGuid().ToString("N").ToUpper()
                }
            };

            // 5. Devolver el Request listo para el Motor
            return new DocumentRequest
            {
                TemplateCode = instance.TemplateCode,
                Data = masterData,
                RequestedBy = requestedBy,
                IsBlindMode = false // Por defecto, se puede sobreescribir si es para Peer Review
            };
        }
    }
}
