using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Diitra.Domain.Common.Documents;

namespace Diitra.Infrastructure.Common.Documents
{
    /// <summary>
    /// Implementación Realista y Enterprise del Orquestador de Datos.
    /// Resuelve el problema de la "Ceguera de Datos" del Builder.
    /// </summary>
    public class DocumentDataOrchestrator : IDocumentDataOrchestrator
    {
        private readonly DiitraContext _db;
        private readonly IEnumerable<IDocumentDataProvider> _providers;

        public DocumentDataOrchestrator(DiitraContext db, IEnumerable<IDocumentDataProvider> providers)
        {
            _db = db;
            _providers = providers;
        }

        public async Task<DocumentRequest> PrepareRequestAsync(string documentInstanceUuid, string requestedBy, CancellationToken ct = default)
        {
            // 1. Obtener la instancia del documento
            var instance = await _db.DocumentInstances
                .FirstOrDefaultAsync(i => i.Uuid == documentInstanceUuid, ct)
                ?? throw new KeyNotFoundException($"No se encontró la instancia: {documentInstanceUuid}");

            // 2. Identificar el tipo de entidad desde la instancia (Resiliencia Enterprise)
            string entityType = instance.EntityType;

            // 3. Buscar el proveedor adecuado
            var provider = _providers.FirstOrDefault(p => p.CanHandle(entityType))
                ?? throw new InvalidOperationException($"No hay un proveedor de datos para el tipo: {entityType}");

            // 4. Obtener los datos base de la entidad
            var entityData = await provider.GetDocumentDataAsync(instance.EntityUuid, ct);

            // 5. Obtener contenido colaborativo (CoWork) vinculado a esta INSTANCIA de documento
            var coworkDocs = await _db.InvCoworkDocumentos
                .Where(d => d.EntidadUuid == instance.Uuid)
                .ToListAsync(ct);

            var collaborativeContent = coworkDocs.ToDictionary(
                d => d.CampoNombre, 
                d => d.ContentHtml ?? string.Empty
            );

            // 6. Construir DTO Maestro
            var masterData = new
            {
                Data = entityData,
                ContenidoColaborativo = collaborativeContent,
                Emision = new
                {
                    Fecha = DateTime.Now.ToString("dd/MM/yyyy HH:mm"),
                    Usuario = requestedBy,
                    TraceCode = instance.TraceabilityCode ?? "BORRADOR"
                }
            };

            // 7. Devolver Request con bandera de Draft Mode si no ha sido finalizado
            return new DocumentRequest
            {
                TemplateCode = instance.TemplateCode,
                Data = masterData,
                RequestedBy = requestedBy,
                IsDraftMode = instance.State != DocumentState.Signed,
                IsBlindMode = false 
            };
        }
    }
}
