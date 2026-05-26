using Microsoft.AspNetCore.Mvc;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;

    public AuthController(IAuthService authService, IConfiguration configuration)
    {
        _authService = authService;
        _configuration = configuration;
    }

    /// <summary>
    /// Autentica a un usuario y genera una cookie HttpOnly con el JWT, retornando ambos tokens en la respuesta.
    /// </summary>
    /// <param name="request">Credenciales del usuario (usuario y contraseña).</param>
    /// <returns>Información del usuario autenticado y sus permisos.</returns>
    /// <response code="200">Login exitoso.</response>
    /// <response code="401">Credenciales incorrectas.</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);

        if (response == null)
        {
            return Unauthorized(new { message = "Credenciales incorrectas" });
        }

        // Guardar el JWT en una cookie HttpOnly para compatibilidad local
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // En localhost lo dejamos en false si no hay SSL
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddHours(8) // Vigencia sincronizada con el access token (8 horas)
        };

        Response.Cookies.Append("diitra_auth", response.Token, cookieOptions);

        return Ok(response);
    }

    /// <summary>
    /// Endpoint para refrescar el Access Token utilizando un Refresh Token firmado criptográficamente de forma stateless.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] JsonElement body)
    {
        var refreshToken = ExtractRefreshToken(body);
        if (string.IsNullOrEmpty(refreshToken))
            return BadRequest(new { message = "Refresh token required" });

        try
        {
            var jwtSettings = _configuration.GetSection("JWTSettings");
            var secret = jwtSettings["Secret"] ?? "ISTPET_Sistemas_Seguridad_ClaveCompartidaSecretSymmetricKey2026!";
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(secret);

            // Validar la firma y la fecha de expiración del Refresh Token JWT
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"] ?? "auth_global_istpet",
                ValidAudience = jwtSettings["Audience"] ?? "all",
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(refreshToken, validationParameters, out var validatedToken);
            
            // Comprobar que realmente es un token de refresco
            var tokenType = principal.Claims.FirstOrDefault(c => c.Type == "token_type")?.Value;
            if (tokenType != "refresh")
                return Unauthorized(new { message = "Invalid refresh token type" });

            var username = principal.Claims.FirstOrDefault(c => c.Type == "sub")?.Value 
                           ?? principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(username))
                return Unauthorized(new { message = "Invalid refresh token claims" });

            // Consultar y re-emitir nuevo par de tokens
            var response = await _authService.RefreshAuthResponseAsync(username);
            if (response == null)
                return Unauthorized(new { message = "User not found or inactive" });

            // Actualizar la cookie local para compatibilidad
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(8)
            };
            Response.Cookies.Append("diitra_auth", response.Token, cookieOptions);

            return Ok(new
            {
                accessToken = response.Token,
                refreshToken = response.RefreshToken,
                expiresIn = 28800 // 8 horas en segundos
            });
        }
        catch (Exception ex)
        {
            return Unauthorized(new { message = "Invalid or expired refresh token", detail = ex.Message });
        }
    }

    /// <summary>
    /// Destruye la sesión eliminando la cookie local de autenticación.
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("diitra_auth");
        return Ok(new { message = "Logout processed successfully" });
    }

    /// <summary>
    /// Obtiene los datos y claims del usuario actual a partir del token autenticado.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            var nombre = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("nombre")?.Value;
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Union(User.FindAll("roles").Select(c => c.Value)).Distinct().ToList();
            var tipo = User.FindFirst("tipo_usuario")?.Value;
            var isAdmin = User.FindFirst("es_admin")?.Value == "true" || tipo == "ADMIN";
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();

            return Ok(new
            {
                id_referencia = idReferencia,
                nombre_completo = nombre,
                role = roles.FirstOrDefault(),
                roles = roles,
                tipo_usuario = tipo,
                administrador = isAdmin,
                permissions = permissions
            });
        }

        return Unauthorized();
    }

    /// <summary>
    /// Valida si un token SSO es correcto y activo.
    /// </summary>
    [HttpGet("validate-sso")]
    [HttpPost("validate-sso")]
    public IActionResult ValidateSso()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return Ok(new { valid = true, user = User.Identity.Name ?? User.FindFirst("sub")?.Value });
        }
        return Unauthorized(new { valid = false });
    }

    private string? ExtractRefreshToken(JsonElement body)
    {
        if (body.ValueKind == JsonValueKind.Object)
        {
            if (body.TryGetProperty("refreshToken", out var tokenProp))
                return tokenProp.GetString();
            if (body.TryGetProperty("refresh_token", out var tokenPropSnake))
                return tokenPropSnake.GetString();
        }
        return null;
    }
}
