using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research
{
    public static class GroupsHelper
    {
        public static GroupDto MapToDto(DiitraContext? context, InvGrupoInvestigacion g, Dictionary<string, string>? preloadedPhones = null)
        {
            string telefono = g.TelefonoCoordinador ?? string.Empty;
            if (string.IsNullOrEmpty(telefono) && g.IdCoordinadorNavigation?.IdSigafi != null)
            {
                var sigafiTrim = g.IdCoordinadorNavigation.IdSigafi.Trim();
                if (preloadedPhones != null && preloadedPhones.TryGetValue(sigafiTrim, out var phoneVal))
                {
                    telefono = phoneVal;
                }
                else if (context != null)
                {
                    telefono = GetUserPhoneFromCatalog(context, sigafiTrim, g.IdCoordinadorNavigation.TablaSigafi);
                }
            }

            return new GroupDto
            {
                IdGrupo = g.IdGrupo,
                Uuid = g.Uuid,
                Nombre = g.Nombre,
                Siglas = g.Siglas,
                TipoGrupo = g.TipoGrupo,
                IdDominio = g.IdDominio,
                IdCoordinador = g.IdCoordinador,
                IdProfesorCoordinador = g.IdCoordinadorNavigation?.IdSigafi,
                NombreCoordinador = g.IdCoordinadorNavigation?.Nombre,
                ObjetivoGeneral = g.ObjetivoGeneral,
                Mision = g.Mision,
                Vision = g.Vision,
                ResolucionAprobacion = g.ResolucionAprobacion,
                FechaCreacion = g.FechaCreacion,
                CategoriaConsolidacion = g.CategoriaConsolidacion,
                Activo = g.Activo ?? false,
                Estado = g.Estado,
                LinkWhatsapp = g.LinkWhatsapp,
                FotoUrl = g.FotoUrl,
                TelefonoCoordinador = telefono,
                LineasIds = g.IdLineas.Select(l => l.IdLinea).ToList(),
                CarrerasIds = g.IdCarreras.Select(c => c.IdCarrera).ToList(),
                LineasNombres = g.IdLineas.Select(l => l.NombreLinea).ToList(),
                CarrerasNombres = g.IdCarreras.Select(c => c.Carrera1 ?? string.Empty).Where(n => !string.IsNullOrEmpty(n)).ToList(),
                TeacherMemberCedulas = g.InvGruposMiembros
                    .Where(m => m.Activo == true && m.IdUsuarioNavigation != null && m.IdUsuarioNavigation.TablaSigafi == "profesor" && !string.IsNullOrEmpty(m.IdUsuarioNavigation.IdSigafi))
                    .Select(m => m.IdUsuarioNavigation.IdSigafi.Trim())
                    .ToList()
            };
        }

        public static string GetUserPhoneFromCatalog(DiitraContext context, string? idSigafi, string? tablaSigafi)
        {
            if (string.IsNullOrEmpty(idSigafi)) return string.Empty;
            var sigafiTrim = idSigafi.Trim();
            string phone = string.Empty;
            if (tablaSigafi == "profesor")
            {
                var prof = context.Profesores.AsNoTracking().FirstOrDefault(p => p.IdProfesor == sigafiTrim);
                phone = prof != null ? (prof.Celular ?? prof.Telefono ?? string.Empty) : string.Empty;
            }
            else if (tablaSigafi == "alumno")
            {
                var alum = context.Alumnos.AsNoTracking().FirstOrDefault(a => a.IdAlumno == sigafiTrim);
                phone = alum != null ? (alum.Celular ?? alum.Telefono ?? string.Empty) : string.Empty;
            }

            if (string.IsNullOrEmpty(phone)) return string.Empty;
            phone = phone.Trim();
            if (phone.Length == 9 && phone.StartsWith("9"))
            {
                phone = "0" + phone;
            }
            return phone;
        }
    }
}
