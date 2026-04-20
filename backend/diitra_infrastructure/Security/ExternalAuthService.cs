using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Security;

public interface IExternalAuthService
{
    Task<string> GenerateMagicLinkAsync(string idReferencia, string tipoReferencia, string? scopes = null, int hoursValid = 24);
    Task<AccessToken?> ValidateTokenAsync(string token);
    Task MarkTokenAsUsedAsync(string token);
}

public class ExternalAuthService : IExternalAuthService
{
    private readonly DiitraContext _context;

    public ExternalAuthService(DiitraContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateMagicLinkAsync(string idReferencia, string tipoReferencia, string? scopes = null, int hoursValid = 24)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)); // 64 caracteres hex
        
        var accessToken = new AccessToken
        {
            Token = token,
            IdReferencia = idReferencia,
            TipoReferencia = tipoReferencia,
            Scopes = scopes,
            FechaExpiracion = DateTime.UtcNow.AddHours(hoursValid),
            Usado = false,
            Activo = true
        };

        _context.AccessTokens.Add(accessToken);
        await _context.SaveChangesAsync();

        return token;
    }

    public async Task<AccessToken?> ValidateTokenAsync(string token)
    {
        var accessToken = await _context.AccessTokens
            .FirstOrDefaultAsync(t => t.Token == token && t.Activo && !t.Usado);

        if (accessToken == null || accessToken.IsExpired)
            return null;

        return accessToken;
    }

    public async Task MarkTokenAsUsedAsync(string token)
    {
        var accessToken = await _context.AccessTokens.FirstOrDefaultAsync(t => t.Token == token);
        if (accessToken != null)
        {
            accessToken.Usado = true;
            await _context.SaveChangesAsync();
        }
    }
}
