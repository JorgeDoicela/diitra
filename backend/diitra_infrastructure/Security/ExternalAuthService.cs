using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.Security;

public interface IExternalAuthService
{
    Task<string> CreateAccessTokenAsync(int idReferencia, string tipoReferencia, string? scopes = null, int hoursValid = 24);
    Task<AccessToken?> ValidateTokenAsync(string token);
}

public class ExternalAuthService : IExternalAuthService
{
    private readonly DiitraContext _context;

    public ExternalAuthService(DiitraContext context)
    {
        _context = context;
    }

    public async Task<string> CreateAccessTokenAsync(int idReferencia, string tipoReferencia, string? scopes = null, int hoursValid = 24)
    {
        var token = Guid.NewGuid().ToString("N");
        var accessToken = new AccessToken
        {
            Token = token,
            IdReferencia = idReferencia,
            TipoReferencia = tipoReferencia,
            Scopes = scopes,
            FechaExpiracion = DateTime.UtcNow.AddHours(hoursValid),
            Activo = 1,
            UsosActuales = 0,
            MaxUsos = 1,
            Version = 1
        };

        _context.InvTokensAcceso.Add(accessToken);
        await _context.SaveChangesAsync();

        return token;
    }

    public async Task<AccessToken?> ValidateTokenAsync(string token)
    {
        var accessToken = await _context.InvTokensAcceso
            .FirstOrDefaultAsync(t => t.Token == token && t.Activo == 1 && t.UsosActuales < t.MaxUsos && (t.FechaExpiracion == null || t.FechaExpiracion > DateTime.UtcNow));

        return accessToken;
    }

    public async Task<bool> MarkTokenAsUsedAsync(string token)
    {
        var accessToken = await _context.InvTokensAcceso.FirstOrDefaultAsync(t => t.Token == token);
        if (accessToken != null && accessToken.UsosActuales < accessToken.MaxUsos)
        {
            accessToken.UsosActuales++;
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }
}
