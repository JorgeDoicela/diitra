using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research
{
    public static class ProjectHelper
    {
        public static async Task<string> GetUserPhoneFromCatalogAsync(DiitraContext context, string? idSigafi, string? tablaSigafi)
        {
            if (string.IsNullOrEmpty(idSigafi)) return string.Empty;
            var sigafiTrim = idSigafi.Trim();

            if (tablaSigafi == "profesor")
            {
                var prof = await context.Profesores.FirstOrDefaultAsync(p => p.IdProfesor == sigafiTrim);
                return prof?.Celular ?? prof?.Telefono ?? string.Empty;
            }
            else if (tablaSigafi == "alumno")
            {
                var alum = await context.Alumnos.FirstOrDefaultAsync(a => a.IdAlumno == sigafiTrim);
                return alum?.Celular ?? alum?.Telefono ?? string.Empty;
            }
            return string.Empty;
        }

        public static async Task<string> GetUserEmailFromCatalogAsync(DiitraContext context, string? idSigafi, string? tablaSigafi)
        {
            if (string.IsNullOrEmpty(idSigafi)) return string.Empty;
            var sigafiTrim = idSigafi.Trim();

            if (tablaSigafi == "profesor")
            {
                var prof = await context.Profesores.FirstOrDefaultAsync(p => p.IdProfesor == sigafiTrim);
                return prof != null ? (prof.EmailInstitucional ?? prof.Email ?? string.Empty) : string.Empty;
            }
            else if (tablaSigafi == "alumno")
            {
                var alum = await context.Alumnos.FirstOrDefaultAsync(a => a.IdAlumno == sigafiTrim);
                return alum != null ? (alum.EmailInstitucional ?? alum.Email ?? string.Empty) : string.Empty;
            }
            return string.Empty;
        }

        public static DateOnly? ParseDateOnly(string? dateStr)
        {
            if (string.IsNullOrWhiteSpace(dateStr)) return null;

            if (dateStr.Contains("T"))
            {
                dateStr = dateStr.Split('T')[0];
            }

            if (DateOnly.TryParseExact(dateStr, new[] { "dd/MM/yyyy", "yyyy-MM-dd", "d/M/yyyy" }, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var result))
            {
                return result;
            }

            if (DateOnly.TryParse(dateStr, out result))
            {
                return result;
            }

            return null;
        }

        public static string NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
                return "Co-Investigador";

            var r = role.Trim().ToLowerInvariant();
            if (r.Contains("director") || r.Contains("principal")) return "Director de Proyecto";
            if (r.Contains("semillerista") || r.Contains("estudiante") || r.Contains("alumno")) return "Semillerista";

            return "Co-Investigador";
        }

        public static List<bool> GetSemanasCalculadas(DateOnly? pStart, DateOnly? pEnd, DateOnly? aStart, DateOnly? aEnd)
        {
            var result = new List<bool>();
            if (!pStart.HasValue || !pEnd.HasValue || !aStart.HasValue || !aEnd.HasValue)
            {
                return result;
            }

            var start = pStart.Value;
            var end = pEnd.Value;
            var totalDays = (end.ToDateTime(TimeOnly.MinValue) - start.ToDateTime(TimeOnly.MinValue)).Days;
            var weeks = (int)Math.Ceiling(totalDays / 7.0);
            if (weeks <= 0) weeks = 1;

            for (int i = 0; i < weeks; i++)
            {
                var wStart = start.AddDays(i * 7);
                var wEnd = wStart.AddDays(6);

                bool intersects = !(aEnd.Value < wStart || aStart.Value > wEnd);
                result.Add(intersects);
            }

            return result;
        }

        public static async Task<InvGrupoInvestigacion?> ResolveApprovedGroupAsync(DiitraContext context, string? groupUuid)
        {
            if (string.IsNullOrWhiteSpace(groupUuid))
            {
                return null;
            }

            var normalized = groupUuid.Trim();
            if (!Guid.TryParse(normalized, out _))
            {
                return await context.InvGruposInvestigacion.FirstOrDefaultAsync(g =>
                    g.Nombre.ToLower() == normalized.ToLower() &&
                    g.Activo == true &&
                    g.Estado == "Aprobado");
            }

            return await context.InvGruposInvestigacion
                .FirstOrDefaultAsync(g => g.Uuid == normalized &&
                g.Activo == true &&
                g.Estado == "Aprobado");
        }
    }
}
