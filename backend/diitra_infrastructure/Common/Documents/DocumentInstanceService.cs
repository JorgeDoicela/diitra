using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using Diitra.Domain.Common.Documents;
using System.Text.Json;
using Diitra.Infrastructure.Common.Storage;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Diitra.Infrastructure.Common.Documents
{
    public class DocumentInstanceService : IDocumentInstanceService
    {
        private readonly DiitraContext _context;
        private readonly IFileStorageService _storageService;
        private readonly IServiceProvider _serviceProvider;

        public DocumentInstanceService(DiitraContext context, IFileStorageService storageService, IServiceProvider serviceProvider)
        {
            _context = context;
            _storageService = storageService;
            _serviceProvider = serviceProvider;
        }

        public async Task<DocumentInstance> CreateAsync(string templateCode, string entityUuid, string createdBy, string? title = null, string entityType = "Proyecto", CancellationToken ct = default)
        {
            var template = await _context.DocumentTemplates
                .FirstOrDefaultAsync(t => t.Code == templateCode && t.IsActive, ct);

            if (template == null)
            {
                var seed = DocumentTemplateRegistry.GetByCode(templateCode);
                if (seed != null)
                {
                    _context.DocumentTemplates.Add(seed);
                    await _context.SaveChangesAsync(ct);
                    template = seed;
                }
                else
                {
                    throw new KeyNotFoundException($"La plantilla '{templateCode}' no existe o no está activa.");
                }
            }

            var instance = DocumentInstance.Create(templateCode, template.Version, entityUuid, createdBy, title, entityType);
            
            _context.DocumentInstances.Add(instance);
            await _context.SaveChangesAsync(ct);
            
            return instance;
        }

        public async Task<DocumentInstance?> GetByUuidAsync(string uuid, CancellationToken ct = default)
        {
            var instance = await _context.DocumentInstances
                .FirstOrDefaultAsync(i => i.Uuid == uuid, ct);

            if (instance == null)
            {
                // Fallback: Si no se encuentra por UUID de la instancia, podría ser el UUID del proyecto (entityUuid) para el protocolo principal
                instance = await _context.DocumentInstances.FirstOrDefaultAsync(
                    i => i.EntityUuid == uuid && i.TemplateCode == "PROTOCOLO_INVESTIGACION", ct);
            }

            if (instance == null)
            {
                // Auto-creación resiliente si el UUID corresponde a un proyecto existente sin instancia
                var projectExists = await _context.InvProyectos.AnyAsync(p => p.Uuid == uuid, ct);
                if (projectExists)
                {
                    instance = await CreateAsync("PROTOCOLO_INVESTIGACION", uuid, "sistema", "Protocolo Oficial", "Proyecto", ct);
                    await SyncFromProjectAsync(instance, ct);
                }
            }

            if (instance != null)
            {
                await SyncFromProjectAsync(instance, ct);
            }

            return instance;
        }

        public async Task<IEnumerable<DocumentInstance>> GetByEntityAsync(string entityUuid, CancellationToken ct = default)
        {
            // 1. Documentos directamente vinculados al proyecto
            var directDocs = await _context.DocumentInstances
                .Where(i => i.EntityUuid == entityUuid)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync(ct);

            // 2. Agregar documentos de revisiones (RUBRICA_EVALUACION por árbitro).
            //    Al cerrar arbitraje, cada árbitro genera su propia rúbrica con EntityUuid = revision.Uuid
            //    y EntityType = "Revision". Las recuperamos aquí para que el workspace del proyecto
            //    las muestre completas.
            var project = await _context.InvProyectos
                .FirstOrDefaultAsync(p => p.Uuid == entityUuid, ct);

            if (project != null)
            {
                var revisionUuids = await _context.InvRevisionesPares
                    .Where(r => r.IdProyecto == project.IdProyecto)
                    .Select(r => r.Uuid)
                    .ToListAsync(ct);

                if (revisionUuids.Count > 0)
                {
                    var revisionDocs = await _context.DocumentInstances
                        .Where(i => revisionUuids.Contains(i.EntityUuid))
                        .OrderByDescending(i => i.CreatedAt)
                        .ToListAsync(ct);

                    return directDocs.Concat(revisionDocs)
                        .OrderByDescending(i => i.CreatedAt)
                        .ToList();
                }
            }

            return directDocs;
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

        private static readonly HashSet<string> VolatileFields = new(StringComparer.OrdinalIgnoreCase)
        {
            // PROTOCOLO_INVESTIGACION
            "Antecedentes", "DescripcionProyecto", "Justificacion", "ObjetivoGeneral", "ObjetivosEspecificos", 
            "MarcoTeorico", "Metodologia", "Evaluacion", "Bibliografia", "Investigadores", 
            "RecursosDisponibles", "RecursosNecesarios", "Cronograma", "ProductosEsperados",
            // INFORME_AVANCE
            "HitosCompletados", "Evidencias", "PresupuestoEjecutado", "ConclusionesParciales",
            // INFORME_FINAL_INVESTIGACION
            "resumen_ejecutivo", "cumplimiento_objetivos", "resultados", "discusion", 
            "impacto_final", "transferencia_conocimiento", "conclusiones", "recomendaciones", "bibliografia_final",
            // ACTA_COMITE_ETICA
            "JustificacionEtica", "RiesgosIdentificados", "MetodoConsentimiento", "MiembrosFirmantes"
        };

        private static bool IsHtmlEmpty(string? html)
        {
            if (string.IsNullOrWhiteSpace(html)) return true;
            
            // Eliminar etiquetas HTML vacías y sus variantes comunes
            string normalized = html.Replace("<p></p>", "")
                                    .Replace("<p> </p>", "")
                                    .Replace("<p>&nbsp;</p>", "")
                                    .Replace("<br>", "")
                                    .Replace("<br/>", "")
                                    .Replace("<br />", "")
                                    .Trim();
            
            return string.IsNullOrEmpty(normalized);
        }

        public async Task<DocumentInstance> UpdateMetadataAsync(string uuid, string metadataJson, CancellationToken ct = default)
        {
            Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Iniciando para Uuid: {uuid}");
            var instance = await _context.DocumentInstances.FirstOrDefaultAsync(i => i.Uuid == uuid, ct);
            
            if (instance == null)
            {
                // Fallback: Tal vez nos pasaron el UUID del proyecto (entityUuid) para el protocolo principal.
                Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Buscando fallback por EntityUuid: {uuid}");
                instance = await _context.DocumentInstances.FirstOrDefaultAsync(
                    i => i.EntityUuid == uuid && i.TemplateCode == "PROTOCOLO_INVESTIGACION", ct);
            }

            if (instance == null)
            {
                // Auto-creación resiliente: si el proyecto existe, creamos la instancia del protocolo principal
                // en caliente para evitar fallos de inicialización o guardado.
                Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Buscando proyecto para auto-creación resiliente. Uuid: {uuid}");
                var projectExists = await _context.InvProyectos.AnyAsync(p => p.Uuid == uuid, ct);
                if (projectExists)
                {
                    Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Auto-creando PROTOCOLO_INVESTIGACION para proyecto Uuid: {uuid}");
                    instance = await CreateAsync("PROTOCOLO_INVESTIGACION", uuid, "sistema", "Protocolo Oficial", "Proyecto", ct);
                    await SyncFromProjectAsync(instance, ct);
                }
            }

            if (instance == null)
            {
                Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] ERROR: La instancia o proyecto '{uuid}' no existe.");
                throw new KeyNotFoundException($"La instancia o proyecto '{uuid}' no existe.");
            }

            // Fusionar inteligentemente metadatos si ya existe un snapshot previo
            if (!string.IsNullOrEmpty(instance.DataSnapshotJson))
            {
                try
                {
                    Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Fusionando metadatos. Existente: {instance.DataSnapshotJson.Length} bytes, Entrante: {metadataJson?.Length ?? 0} bytes");
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var existingObj = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(instance.DataSnapshotJson, options);
                    var incomingObj = !string.IsNullOrEmpty(metadataJson)
                        ? JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(metadataJson, options)
                        : null;
                    
                    if (existingObj != null && incomingObj != null)
                    {
                        var mergedObj = new Dictionary<string, object>();
                        
                        foreach (var kvp in existingObj)
                        {
                            mergedObj[kvp.Key] = kvp.Value;
                        }
                        
                        foreach (var kvp in incomingObj)
                        {
                            var key = kvp.Key;
                            var incomingVal = kvp.Value;
                            
                            bool isVolatileField = VolatileFields.Contains(key);

                            if (isVolatileField)
                            {
                                bool isIncomingEmpty = incomingVal.ValueKind == JsonValueKind.Null ||
                                                       incomingVal.ValueKind == JsonValueKind.Undefined ||
                                                       (incomingVal.ValueKind == JsonValueKind.String && IsHtmlEmpty(incomingVal.GetString())) ||
                                                       (incomingVal.ValueKind == JsonValueKind.Array && incomingVal.GetArrayLength() == 0);

                                if (isIncomingEmpty)
                                {
                                    if (existingObj.TryGetValue(key, out var existingVal))
                                    {
                                        bool isExistingEmpty = existingVal.ValueKind == JsonValueKind.Null ||
                                                               existingVal.ValueKind == JsonValueKind.Undefined ||
                                                               (existingVal.ValueKind == JsonValueKind.String && IsHtmlEmpty(existingVal.GetString())) ||
                                                               (existingVal.ValueKind == JsonValueKind.Array && existingVal.GetArrayLength() == 0);
                                        
                                        if (!isExistingEmpty)
                                        {
                                            Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Omitiendo sobreescritura de campo volátil '{key}' con valor entrante vacío.");
                                            continue; // Conservar el existente
                                        }
                                    }
                                }
                            }
                            
                            mergedObj[key] = incomingVal;
                        }
                        
                        metadataJson = JsonSerializer.Serialize(mergedObj);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Error al fusionar instantánea de metadatos: {ex.Message}");
                    System.Diagnostics.Debug.WriteLine($"[DIITRA] Error merging metadata snapshot: {ex.Message}");
                }
            }

            instance.UpdateDataSnapshot(metadataJson);
            await _context.SaveChangesAsync(ct);
            Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Completado con éxito. Nuevo tamaño: {metadataJson?.Length ?? 0} bytes");
            return instance;
        }

        public async Task<DocumentInstance> ResolveAsync(string templateCode, string entityUuid, string createdBy, string? title = null, string entityType = "Proyecto", CancellationToken ct = default)
        {
            var existing = await _context.DocumentInstances
                .FirstOrDefaultAsync(i => i.EntityUuid == entityUuid && i.TemplateCode == templateCode, ct);

            if (existing != null)
            {
                await SyncFromProjectAsync(existing, ct);
                return existing;
            }

            var created = await CreateAsync(templateCode, entityUuid, createdBy, title, entityType, ct);
            await SyncFromProjectAsync(created, ct);
            return created;
        }

        private async Task SyncFromProjectAsync(DocumentInstance instance, CancellationToken ct)
        {
            if (instance.TemplateCode == "PROTOCOLO_INVESTIGACION")
            {
                Console.WriteLine($"[DIITRA] [SyncFromProjectAsync] Iniciando sincronización relacional para instancia: {instance.Uuid}");
                var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == instance.EntityUuid, ct);
                if (project != null)
                {
                    try
                    {
                        var orchestrator = _serviceProvider.GetRequiredService<Diitra.Application.Research.IProjectOrchestrator>();
                        var projectDetail = await orchestrator.GetProjectDetailAsync(project.Uuid);
                        if (projectDetail != null)
                        {
                            if (string.IsNullOrEmpty(instance.DataSnapshotJson))
                            {
                                var json = JsonSerializer.Serialize(projectDetail);
                                Console.WriteLine($"[DIITRA] [SyncFromProjectAsync] Snapshot vacío. Reconstrucción exitosa. Longitud: {json.Length}");
                                instance.UpdateDataSnapshot(json);
                                project.MetadataCacesJson = json;
                                await _context.SaveChangesAsync(ct);
                            }
                            else
                            {
                                // Si ya existe, fusionamos campos clave del proyecto relacional (Título, Grupo, Integrantes)
                                // para evitar que datos viejos del editor de documentos sobrescriban los del Workspace.
                                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                                var snapshot = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(instance.DataSnapshotJson, options);
                                if (snapshot != null)
                                {
                                    var merged = new Dictionary<string, object>();
                                    foreach (var kvp in snapshot)
                                    {
                                        merged[kvp.Key] = kvp.Value;
                                    }

                                    merged["Titulo"] = projectDetail.Titulo ?? "";
                                    merged["GrupoInvestigacionTipo"] = projectDetail.TieneGrupoInvestigacion == true ? "SI" : "NO";
                                    merged["GrupoInvestigacionNombre"] = projectDetail.GrupoInvestigacion ?? "";
                                    merged["GrupoInvestigacionUuid"] = projectDetail.GrupoInvestigacionUuid ?? "";
                                    merged["TieneGrupoInvestigacion"] = projectDetail.TieneGrupoInvestigacion ?? false;
                                    merged["Investigadores"] = projectDetail.Investigadores ?? new List<Diitra.Application.Research.Dtos.InvestigadorDto>();

                                    var json = JsonSerializer.Serialize(merged);
                                    instance.UpdateDataSnapshot(json);
                                    project.MetadataCacesJson = json;
                                    await _context.SaveChangesAsync(ct);
                                    Console.WriteLine($"[DIITRA] [SyncFromProjectAsync] Snapshot fusionado y sincronizado con éxito.");
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DIITRA] [SyncFromProjectAsync] ERROR al sincronizar/fusionar con proyecto: {ex.Message}");
                    }
                }
                else
                {
                    Console.WriteLine($"[DIITRA] [SyncFromProjectAsync] No se encontró el proyecto con EntityUuid: {instance.EntityUuid}");
                }
            }
        }
    }
}
