using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using Diitra.Domain.Common.Documents;
using Diitra.Infrastructure.Common.Storage;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace Diitra.Infrastructure.Common.Documents
{
    public class DocumentInstanceService : IDocumentInstanceService
    {
        private readonly DiitraContext _context;
        private readonly IFileStorageService _storageService;

        public DocumentInstanceService(DiitraContext context, IFileStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        public async Task<DocumentInstance> CreateAsync(string templateCode, string entityUuid, string createdBy, string? title = null, string entityType = "Proyecto", CancellationToken ct = default)
        {
            var template = await _context.DocumentTemplates
                .FirstOrDefaultAsync(t => t.Code == templateCode && t.IsActive, ct);

            if (template == null)
                throw new KeyNotFoundException($"La plantilla '{templateCode}' no existe o no está activa.");

            var instance = DocumentInstance.Create(templateCode, template.Version, entityUuid, createdBy, title, entityType);
            
            _context.DocumentInstances.Add(instance);
            await _context.SaveChangesAsync(ct);
            
            return instance;
        }

        public async Task<DocumentInstance?> GetByUuidAsync(string uuid, CancellationToken ct = default)
        {
            return await _context.DocumentInstances
                .FirstOrDefaultAsync(i => i.Uuid == uuid, ct);
        }

        public async Task<IEnumerable<DocumentInstance>> GetByEntityAsync(string entityUuid, CancellationToken ct = default)
        {
            return await _context.DocumentInstances
                .Where(i => i.EntityUuid == entityUuid)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<DocumentInstance>> GetAllAsync(int limit = 20, CancellationToken ct = default)
        {
            return await _context.DocumentInstances
                .OrderByDescending(i => i.CreatedAt)
                .Take(limit)
                .ToListAsync(ct);
        }

        public async Task<DocumentInstance> FinalizeAsync(string uuid, byte[] pdfContent, string fileName, string hash, string traceabilityCode, CancellationToken ct = default)
        {
            var instance = await _context.DocumentInstances
                .FirstOrDefaultAsync(i => i.Uuid == uuid, ct);

            if (instance == null)
                throw new KeyNotFoundException($"La instancia '{uuid}' no existe.");

            // 1. Guardar el archivo físico usando el servicio de almacenamiento
            var relativePath = await _storageService.SaveFileAsync(fileName, pdfContent);

            // 2. Finalizar la instancia en la base de datos
            instance.Finalize(relativePath, hash, traceabilityCode);
            
            await _context.SaveChangesAsync(ct);
            return instance;
        }

        public async Task<DocumentInstance> UpdateMetadataAsync(string uuid, string metadataJson, CancellationToken ct = default)
        {
            var instance = await _context.DocumentInstances.FirstOrDefaultAsync(i => i.Uuid == uuid, ct);
            if (instance == null) throw new KeyNotFoundException($"La instancia '{uuid}' no existe.");
            
            if (instance.EntityUuid == "GLOBAL")
            {
                instance.SetEntityUuid(uuid);
            }

            instance.UpdateDataSnapshot(metadataJson);
            await _context.SaveChangesAsync(ct);
            return instance;
        }
    }
}
