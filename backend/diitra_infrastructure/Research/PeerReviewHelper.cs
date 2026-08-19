using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research
{
    public static class PeerReviewHelper
    {
        public static PeerReviewDto MapToDto(
            InvRevisionesPares r,
            string nombreRevisor,
            InvUsuarioMetadata? meta = null,
            string? revisorCarrera = null)
        {
            string? institucion = null;
            if (!string.IsNullOrEmpty(meta?.Configuracion))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(meta.Configuracion);
                    if (doc.RootElement.TryGetProperty("institucion", out var prop))
                    {
                        institucion = prop.GetString();
                    }
                }
                catch { }
            }

            return new PeerReviewDto
            {
                Uuid = r.Uuid,
                IdProyecto = r.IdProyecto,
                ProyectoUuid = r.Proyecto?.Uuid ?? "",
                ProyectoTitulo = r.Proyecto?.Titulo ?? "",
                IdRevisor = r.IdRevisor ?? 0,
                RevisorNombre = nombreRevisor,
                RevisorEspecialidad = meta?.Especialidad,
                RevisorGrado = meta?.GradoAcademicoMaximo,
                FechaAsignacion = r.FechaAsignacion,
                FechaLimite = r.FechaLimite,
                FechaCompletado = r.FechaCompletado,
                Estado = r.Estado,
                EsExterno = r.EsExterno,
                EsDobleCiego = r.EsDobleCiego,
                PuntajeTotal = r.PuntajeTotal,
                ObservacionesGral = r.ObservacionesGral,
                RevisorCarrera = revisorCarrera,
                Institucion = institucion
            };
        }

        public static string DeterminarEstadoArbitraje(List<InvRevisionesPares> revisiones, decimal puntajeMinimo = 70m)
        {
            if (!revisiones.Any()) return "SinArbitros";
            if (revisiones.All(r => r.Estado == "Completada"))
            {
                var scores = revisiones.Where(r => r.PuntajeTotal.HasValue).Select(r => r.PuntajeTotal!.Value).ToList();
                var aprobadosCount = scores.Count(s => s >= puntajeMinimo);
                var rechazadosCount = scores.Count(s => s < puntajeMinimo);
                if (aprobadosCount == rechazadosCount && scores.Count > 0) return "Desempate";
                return "Completado";
            }
            if (revisiones.Any(r => r.Estado == "Completada")) return "EnProceso";
            return "Pendiente";
        }

        public static bool CriterioCoincide(string criterioDetalle, string nombreCriterio)
        {
            if (string.IsNullOrWhiteSpace(criterioDetalle) || string.IsNullOrWhiteSpace(nombreCriterio))
                return false;

            return criterioDetalle.Trim().Equals(nombreCriterio.Trim(), StringComparison.OrdinalIgnoreCase);
        }

        public static decimal CalcularPromedioPonderado(
            List<InvRevisionesPares> revisiones,
            List<(string Nombre, decimal Peso)> criterios)
        {
            if (!revisiones.Any()) return 0;

            decimal totalPonderado = 0;
            int criteriosConDatos = 0;

            foreach (var (nombre, _) in criterios)
            {
                var puntajesCriterio = revisiones
                    .SelectMany(r => r.Detalles
                        .Where(d => CriterioCoincide(d.Criterio, nombre))
                        .Select(d => d.Puntaje))
                    .ToList();

                if (puntajesCriterio.Count > 0)
                {
                    totalPonderado += puntajesCriterio.Average();
                    criteriosConDatos++;
                }
            }

            if (criteriosConDatos == 0)
            {
                var conTotal = revisiones.Where(r => r.PuntajeTotal.HasValue).ToList();
                return conTotal.Count > 0
                    ? Math.Round(conTotal.Average(r => r.PuntajeTotal!.Value), 2)
                    : 0;
            }

            return Math.Round(totalPonderado, 2);
        }

        public static async Task<List<(string Nombre, decimal Peso)>> ObtenerCriteriosRubricaAsync(DiitraContext context, int? idConvocatoria)
        {
            InvRubrica? rubrica = null;

            if (idConvocatoria.HasValue)
            {
                var convocatoria = await context.InvConvocatorias
                    .FirstOrDefaultAsync(c => c.IdConvocatoria == idConvocatoria.Value);
                if (convocatoria != null && convocatoria.IdRubrica.HasValue)
                {
                    rubrica = await context.InvRubricas
                        .Include(r => r.InvRubricaCriterios)
                        .FirstOrDefaultAsync(r => r.IdRubrica == convocatoria.IdRubrica.Value);
                }
            }

            if (rubrica == null)
            {
                rubrica = await context.InvRubricas
                    .Include(r => r.InvRubricaCriterios)
                    .FirstOrDefaultAsync(r => r.Activo == true);
            }

            if (rubrica == null)
            {
                rubrica = await context.InvRubricas
                    .Include(r => r.InvRubricaCriterios)
                    .FirstOrDefaultAsync();
            }

            if (rubrica?.InvRubricaCriterios.Any() == true)
            {
                return rubrica.InvRubricaCriterios
                    .OrderBy(c => c.Orden)
                    .Select(c => (c.Nombre, c.PesoPorcentaje))
                    .ToList();
            }

            throw new InvalidOperationException("No se ha configurado ninguna rúbrica de evaluación con criterios en la base de datos.");
        }
    }
}
