using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Common.Notifications
{
    public class EmailTemplateService : IEmailTemplateService
    {
        private readonly DiitraContext _context;

        public EmailTemplateService(DiitraContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EmailTemplateDto>> GetTemplatesAsync()
        {
            var list = await _context.InvEmailTemplates
                .OrderByDescending(t => t.FechaCreado)
                .ToListAsync();

            return list.Select(MapToTemplateDto);
        }

        public async Task<EmailTemplateDto?> GetTemplateByIdAsync(int id)
        {
            var template = await _context.InvEmailTemplates.FindAsync(id);
            return template != null ? MapToTemplateDto(template) : null;
        }

        public async Task<EmailTemplateDto?> GetTemplateByCodigoAsync(string codigo)
        {
            var template = await _context.InvEmailTemplates
                .FirstOrDefaultAsync(t => t.Codigo == codigo);
            return template != null ? MapToTemplateDto(template) : null;
        }

        public async Task<EmailTemplateDto> CreateTemplateAsync(EmailTemplateDto dto)
        {
            var entity = new InvEmailTemplate
            {
                Uuid = string.IsNullOrEmpty(dto.Uuid) ? Guid.NewGuid().ToString() : dto.Uuid,
                Codigo = dto.Codigo,
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                Asunto = dto.Asunto,
                CuerpoHtml = dto.CuerpoHtml,
                Activo = dto.Activo,
                FechaCreado = DateTime.UtcNow,
                FechaActualizado = DateTime.UtcNow
            };

            _context.InvEmailTemplates.Add(entity);
            await _context.SaveChangesAsync();
            
            return MapToTemplateDto(entity);
        }

        public async Task<EmailTemplateDto> UpdateTemplateAsync(EmailTemplateDto dto)
        {
            var entity = await _context.InvEmailTemplates.FindAsync(dto.IdEmailTemplate);
            if (entity == null) throw new KeyNotFoundException("Plantilla no encontrada");

            entity.Codigo = dto.Codigo;
            entity.Nombre = dto.Nombre;
            entity.Descripcion = dto.Descripcion;
            entity.Asunto = dto.Asunto;
            entity.CuerpoHtml = dto.CuerpoHtml;
            entity.Activo = dto.Activo;
            entity.FechaActualizado = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToTemplateDto(entity);
        }

        public async Task DeleteTemplateAsync(int id)
        {
            var template = await _context.InvEmailTemplates.FindAsync(id);
            if (template != null)
            {
                _context.InvEmailTemplates.Remove(template);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<EmailHistorialDto>> GetEmailHistoryAsync(int limit = 100)
        {
            var list = await _context.InvEmailHistorials
                .Include(h => h.IdUsuarioDestinatarioNavigation)
                .OrderByDescending(h => h.FechaEnvio)
                .Take(limit)
                .ToListAsync();

            return list.Select(MapToHistorialDto);
        }

        private EmailTemplateDto MapToTemplateDto(InvEmailTemplate entity)
        {
            return new EmailTemplateDto
            {
                IdEmailTemplate = entity.IdEmailTemplate,
                Uuid = entity.Uuid,
                Codigo = entity.Codigo,
                Nombre = entity.Nombre,
                Descripcion = entity.Descripcion,
                Asunto = entity.Asunto,
                CuerpoHtml = entity.CuerpoHtml,
                Activo = entity.Activo,
                FechaCreado = entity.FechaCreado,
                FechaActualizado = entity.FechaActualizado
            };
        }

        private EmailHistorialDto MapToHistorialDto(InvEmailHistorial entity)
        {
            return new EmailHistorialDto
            {
                IdEmailHistorial = entity.IdEmailHistorial,
                Uuid = entity.Uuid,
                Destinatario = entity.Destinatario,
                IdUsuarioDestinatario = entity.IdUsuarioDestinatario,
                NombreDestinatario = entity.IdUsuarioDestinatarioNavigation?.Nombre,
                Asunto = entity.Asunto,
                Cuerpo = entity.Cuerpo,
                Estado = entity.Estado,
                ErrorMensaje = entity.ErrorMensaje,
                FechaEnvio = entity.FechaEnvio,
                AdjuntosJson = entity.AdjuntosJson,
                MetadataJson = entity.MetadataJson
            };
        }
    }
}
