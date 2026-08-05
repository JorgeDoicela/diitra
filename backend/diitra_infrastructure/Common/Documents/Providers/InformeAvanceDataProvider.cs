using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using Diitra.Domain.Common.Documents;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace Diitra.Infrastructure.Common.Documents.Providers
{
    /// <summary>
    /// Proveedor de Datos para el Informe de Avance de Proyecto (INFORME_AVANCE).
    /// Carga la información del Informe de Avance y del Proyecto vinculado.
    /// </summary>
    public class InformeAvanceDataProvider : IDocumentDataProvider
    {
        private readonly DiitraContext _db;
        private readonly IProjectOrchestrator _projectOrchestrator;

        public InformeAvanceDataProvider(DiitraContext db, IProjectOrchestrator projectOrchestrator)
        {
            _db = db;
            _projectOrchestrator = projectOrchestrator;
        }

        public bool CanHandle(string entityType) =>
            entityType == "InformeAvance" || entityType == "INFORME_AVANCE";

        public async Task<object> GetDocumentDataAsync(string entityUuid, CancellationToken ct = default)
        {
            InvInformeAvance? informe = null;
            DocumentInstance? instance = null;
            ProyectoDto? projectDto = null;
            string projectUuid = "";

            // 1. Buscar la instancia de documento si existe por entityUuid
            instance = await _db.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Uuid == entityUuid || i.EntityUuid == entityUuid, ct);

            // 2. Buscar el informe por UUID
            if (Guid.TryParse(entityUuid, out Guid gUuid))
            {
                informe = await _db.InvInformesAvance
                    .Include(i => i.IdProyectoNavigation)
                    .Include(i => i.InvEvidencias)
                        .ThenInclude(e => e.IdTipoEvidenciaNavigation)
                    .FirstOrDefaultAsync(i => i.Uuid == gUuid, ct);
            }

            // 3. Si no se encontró por UUID de informe, intentar por instancia
            if (informe == null && instance != null)
            {
                if (Guid.TryParse(instance.EntityUuid, out Guid instEntityGuid))
                {
                    informe = await _db.InvInformesAvance
                        .Include(i => i.IdProyectoNavigation)
                        .Include(i => i.InvEvidencias)
                            .ThenInclude(e => e.IdTipoEvidenciaNavigation)
                        .FirstOrDefaultAsync(i => i.Uuid == instEntityGuid, ct);
                }
            }

            if (informe != null)
            {
                projectUuid = informe.IdProyectoNavigation?.Uuid ?? "";
            }
            else
            {
                // Fallback: el entityUuid puede ser el del proyecto directamente
                projectUuid = entityUuid;
                var proj = await _db.InvProyectos
                    .Include(p => p.InvInformesAvance)
                    .FirstOrDefaultAsync(p => p.Uuid == entityUuid, ct);

                if (proj != null && proj.InvInformesAvance.Any())
                {
                    informe = proj.InvInformesAvance.OrderByDescending(i => i.NumeroInforme).FirstOrDefault();
                }
            }

            // Cargar datos detallados del proyecto vía ProjectOrchestrator
            if (!string.IsNullOrEmpty(projectUuid))
            {
                try
                {
                    projectDto = await _projectOrchestrator.GetProjectDetailAsync(projectUuid);
                }
                catch { }
            }

            // Parsear snapshot de la instancia si existe
            JsonElement snapshotJson = default;
            if (instance != null && !string.IsNullOrEmpty(instance.DataSnapshotJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(instance.DataSnapshotJson);
                    snapshotJson = doc.RootElement.Clone();
                }
                catch { }
            }

            // Extraer colecciones del snapshot
            var actividadesEjecutadas = GetArrayFromSnapshot(snapshotJson, "ActividadesEjecutadas");
            var actividadesNoPrevistas = GetArrayFromSnapshot(snapshotJson, "ActividadesNoPrevistas");
            var obstaculos = GetArrayFromSnapshot(snapshotJson, "Obstaculos");

            string conclusionesParciales = GetStringFromSnapshot(snapshotJson, "ConclusionesParciales") ?? "";
            string estadoEjecucion = GetStringFromSnapshot(snapshotJson, "EstadoEjecucion") ?? "EN AVANCE";
            string descripcionFaseActual = GetStringFromSnapshot(snapshotJson, "DescripcionFaseActual") ?? "";
            string observacionesDirector = GetStringFromSnapshot(snapshotJson, "ObservacionesDirector") ?? "";
            string observacionesCoordinador = GetStringFromSnapshot(snapshotJson, "ObservacionesCoordinador") ?? "";

            return new
            {
                // Datos del informe
                NumeroInforme = informe?.NumeroInforme ?? 1,
                FechaReporte = informe?.FechaReporte.ToString("dd/MM/yyyy") ?? DateTime.Now.ToString("dd/MM/yyyy"),
                Estado = informe?.Estado ?? "Pendiente",
                ResumenActividades = informe?.ResumenActividades ?? "",
                EsFirmadoDigital = informe?.EsFirmadoDigital ?? false,
                HashFirma = informe?.HashFirma ?? "",
                FechaFirma = informe?.FechaFirma?.ToString("dd/MM/yyyy HH:mm") ?? "",

                // Datos del proyecto vinculado
                Titulo = projectDto?.Titulo ?? "PROYECTO DE INVESTIGACIÓN",
                CodigoInstitucional = projectDto?.CodigoInstitucional ?? "",
                Programa = projectDto?.Programa ?? "",
                GrupoInvestigacion = projectDto?.GrupoInvestigacion ?? "",
                LineaInvestigacion = projectDto?.LineaInvestigacion ?? "",
                SublineaInvestigacion = projectDto?.SublineaInvestigacion ?? "",
                Carrera = projectDto?.Carrera ?? "",
                PeriodoConvocatoria = projectDto?.PeriodoConvocatoria ?? "",
                DirectorProyecto = projectDto?.DirectorProyecto ?? "DIRECTOR DE PROYECTO",
                FechaInicio = projectDto?.FechaInicio ?? "",
                FechaFin = projectDto?.FechaFin ?? "",

                // Bloques de desarrollo CACES
                ConclusionesParciales = conclusionesParciales,
                EstadoEjecucion = estadoEjecucion,
                DescripcionFaseActual = descripcionFaseActual,
                ObservacionesDirector = observacionesDirector,
                ObservacionesCoordinador = observacionesCoordinador,

                // Listas de actividades
                ActividadesEjecutadas = actividadesEjecutadas,
                ActividadesNoPrevistas = actividadesNoPrevistas,
                Obstaculos = obstaculos,

                // Evidencias registradas
                Evidencias = (informe?.InvEvidencias != null && informe.InvEvidencias.Any())
                    ? informe.InvEvidencias.Select(e => (object)new
                    {
                        TipoEvidencia = e.IdTipoEvidenciaNavigation?.Nombre ?? "Evidencia",
                        Descripcion = e.Descripcion ?? "",
                        RutaArchivo = e.RutaArchivo ?? ""
                    }).ToList()
                    : new List<object>()
            };
        }

        private static List<Dictionary<string, object>> GetArrayFromSnapshot(JsonElement snapshot, string propertyName)
        {
            var result = new List<Dictionary<string, object>>();
            if (snapshot.ValueKind == JsonValueKind.Object && snapshot.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in prop.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.Object)
                    {
                        var dict = new Dictionary<string, object>();
                        foreach (var p in item.EnumerateObject())
                        {
                            dict[p.Name] = p.Value.ToString();
                        }
                        result.Add(dict);
                    }
                }
            }
            return result;
        }

        private static string? GetStringFromSnapshot(JsonElement snapshot, string propertyName)
        {
            if (snapshot.ValueKind == JsonValueKind.Object && snapshot.TryGetProperty(propertyName, out var prop))
            {
                return prop.ToString();
            }
            return null;
        }
    }
}
