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
            var instance = await ResolveEditableInstanceAsync(uuid, ct);

            if (instance != null)
                await SyncFromProjectAsync(instance, ct);

            return instance;
        }

        /// <summary>
        /// Resuelve la instancia editable (Draft o Review) para un UUID dado.
        /// El UUID puede ser el de la instancia directamente, o el del proyecto (entityUuid).
        /// Prioridad: Draft > Review > Signed (fallback). Si solo existe Signed, crea un Draft nuevo.
        /// </summary>
        private async Task<DocumentInstance?> ResolveEditableInstanceAsync(string uuid, CancellationToken ct)
        {
            // 1. Buscar por UUID exacto de instancia
            var instance = await _context.DocumentInstances
                .FirstOrDefaultAsync(i => i.Uuid == uuid, ct);

            // 2. Si se encontró por UUID pero está sellada, intentar redirigir a su Draft más reciente
            if (instance != null && IsImmutable(instance))
            {
                var draft = await FindLatestEditableAsync(instance.EntityUuid, instance.TemplateCode, ct);
                if (draft != null)
                    instance = draft;
                // Si no hay Draft disponible, se retorna la sellada (el caller decide cómo manejarlo)
            }

            // 3. Fallback: el UUID puede corresponder al EntityUuid del proyecto
            if (instance == null)
            {
                instance = await FindLatestEditableAsync(uuid, "PROTOCOLO_INVESTIGACION", ct)
                        ?? await _context.DocumentInstances
                               .Where(i => i.EntityUuid == uuid && i.TemplateCode == "PROTOCOLO_INVESTIGACION")
                               .OrderByDescending(i => i.CreatedAt)
                               .FirstOrDefaultAsync(ct);
            }

            // 4. Auto-creación resiliente: si el proyecto existe pero no tiene instancia, crearla en caliente
            if (instance == null)
            {
                var projectExists = await _context.InvProyectos.AnyAsync(p => p.Uuid == uuid, ct);
                if (projectExists)
                    instance = await CreateAsync("PROTOCOLO_INVESTIGACION", uuid, "sistema", "Protocolo Oficial", "Proyecto", ct);
            }

            return instance;
        }

        /// <summary>Devuelve true si el documento está en un estado que impide modificaciones de contenido.</summary>
        private static bool IsImmutable(DocumentInstance instance) =>
            instance.State == DocumentState.Signed || instance.State == DocumentState.Archived;

        /// <summary>Busca la instancia más reciente en estado editable (Draft o Review) para un EntityUuid y TemplateCode.</summary>
        private async Task<DocumentInstance?> FindLatestEditableAsync(string entityUuid, string templateCode, CancellationToken ct) =>
            await _context.DocumentInstances
                .Where(i => i.EntityUuid == entityUuid
                         && i.TemplateCode == templateCode
                         && (i.State == DocumentState.Draft || i.State == DocumentState.Review))
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync(ct);


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

            // Sanitizar entrada para corregir valores corruptos "[object Object]"
            metadataJson = SanitizeObjectObjectValues(metadataJson);

            // Resolver instancia editable (Draft/Review), con auto-creación si aplica
            var instance = await ResolveEditableInstanceAsync(uuid, ct);

            if (instance == null)
            {
                Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] ERROR: No se encontró instancia ni proyecto para '{uuid}'.");
                throw new KeyNotFoundException($"La instancia o proyecto '{uuid}' no existe.");
            }

            // Si la instancia resuelta sigue siendo inmutable (solo-Signed sin Draft disponible),
            // crear un nuevo Draft que herede el snapshot actual.
            if (IsImmutable(instance))
            {
                Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Instancia sellada. Creando nuevo Draft para '{instance.EntityUuid}'.");
                instance = DocumentInstance.Create(
                    instance.TemplateCode, instance.TemplateVersion,
                    instance.EntityUuid, "sistema",
                    instance.Title, instance.EntityType,
                    instance.DataSnapshotJson);
                _context.DocumentInstances.Add(instance);
                await _context.SaveChangesAsync(ct);
                Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Nuevo Draft creado: {instance.Uuid}");
            }

            // Fusionar metadatos con snapshot existente respetando campos volátiles
            metadataJson = MergeWithExistingSnapshot(instance, metadataJson) ?? metadataJson;

            instance.UpdateDataSnapshot(metadataJson);
            await _context.SaveChangesAsync(ct);
            Console.WriteLine($"[DIITRA] [UpdateMetadataAsync] Guardado exitoso. Instancia: {instance.Uuid}, Tamaño: {metadataJson?.Length ?? 0} bytes");
            return instance;
        }

        private string SanitizeObjectObjectValues(string json)
        {
            if (string.IsNullOrEmpty(json)) return json;
            return System.Text.RegularExpressions.Regex.Replace(
                json,
                @"\""([Ii]mpacto|[Ff]irmasResponsabilidad)\""\s*:\s*\""\[object Object\]\""",
                "\"$1\":null",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        private string? MergeWithExistingSnapshot(DocumentInstance instance, string? incomingJson)
        {
            if (string.IsNullOrEmpty(instance.DataSnapshotJson))
                return incomingJson;

            try
            {
                Console.WriteLine($"[DIITRA] [MergeSnapshot] Fusionando {instance.DataSnapshotJson.Length} bytes existentes con {incomingJson?.Length ?? 0} bytes entrantes.");
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var existing = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                    SanitizeObjectObjectValues(instance.DataSnapshotJson), options);
                var incoming = !string.IsNullOrEmpty(incomingJson)
                    ? JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(incomingJson, options)
                    : null;

                if (existing == null || incoming == null)
                    return incomingJson;

                var merged = new Dictionary<string, object>(existing.ToDictionary(k => k.Key, v => (object)v.Value));

                foreach (var (key, incomingVal) in incoming)
                {
                    if (VolatileFields.Contains(key))
                    {
                        bool incomingEmpty = incomingVal.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined
                            || (incomingVal.ValueKind == JsonValueKind.String && IsHtmlEmpty(incomingVal.GetString()))
                            || (incomingVal.ValueKind == JsonValueKind.Array && incomingVal.GetArrayLength() == 0);

                        if (incomingEmpty && existing.TryGetValue(key, out var existingVal))
                        {
                            bool existingEmpty = existingVal.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined
                                || (existingVal.ValueKind == JsonValueKind.String && IsHtmlEmpty(existingVal.GetString()))
                                || (existingVal.ValueKind == JsonValueKind.Array && existingVal.GetArrayLength() == 0);

                            if (!existingEmpty)
                            {
                                Console.WriteLine($"[DIITRA] [MergeSnapshot] Preservando campo volátil '{key}' (entrante vacío, existente con valor).");
                                continue;
                            }
                        }
                    }
                    merged[key] = incomingVal;
                }

                return JsonSerializer.Serialize(merged);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DIITRA] [MergeSnapshot] Error al fusionar snapshot: {ex.Message}. Usando JSON entrante sin fusionar.");
                return incomingJson;
            }
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

                                    MergeField(merged, "Periodo", projectDetail.Periodo);
                                    MergeField(merged, "FechaPresentacion", projectDetail.FechaPresentacion);
                                    MergeField(merged, "FechaInicio", projectDetail.FechaInicio);
                                    MergeField(merged, "FechaFin", projectDetail.FechaFin);
                                    MergeField(merged, "FechaInicioEstimada", projectDetail.FechaInicioEstimada);
                                    MergeField(merged, "FechaFinEstimada", projectDetail.FechaFinEstimada);
                                    MergeField(merged, "LineaInvestigacion", projectDetail.LineaInvestigacion);
                                    MergeField(merged, "Dominio", projectDetail.Dominio);
                                    MergeField(merged, "Carrera", projectDetail.Carrera);
                                    MergeField(merged, "IdCarrera", projectDetail.IdCarrera);
                                    MergeField(merged, "IdConvocatoria", projectDetail.IdConvocatoria);
                                    MergeField(merged, "IdObjetivoPnd", projectDetail.IdObjetivoPnd);
                                    MergeField(merged, "Programa", projectDetail.Programa);
                                    MergeField(merged, "DirectorProyecto", projectDetail.DirectorProyecto);
                                    MergeField(merged, "TipoInvestigacion", projectDetail.TipoInvestigacion);
                                    MergeField(merged, "CampoAmplio", projectDetail.CampoAmplio);
                                    MergeField(merged, "CampoEspecifico", projectDetail.CampoEspecifico);
                                    MergeField(merged, "CampoDetallado", projectDetail.CampoDetallado);
                                    MergeField(merged, "SublineaInvestigacion", projectDetail.SublineaInvestigacion);
                                    MergeField(merged, "TiempoEjecucion", projectDetail.TiempoEjecucion);

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

        private static void MergeField(Dictionary<string, object> target, string key, object? newValue)
        {
            if (newValue == null) return;
            if (newValue is string str && string.IsNullOrWhiteSpace(str)) return;

            var existingKey = target.Keys.FirstOrDefault(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase)) ?? key;
            target[existingKey] = newValue;
        }
    }
}
