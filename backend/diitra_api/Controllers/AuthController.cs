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
    [ProducesResponseType(429)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (response, blocked) = await _authService.LoginAsync(request);

        // Cuenta bloqueada por exceso de intentos → 429 Too Many Requests
        if (blocked != null)
        {
            Response.Headers.Append("Retry-After", blocked.SegundosRestantes.ToString());
            return StatusCode(429, blocked);
        }

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
    /// Inicia sesión utilizando un token de Microsoft SSO.
    /// </summary>
    /// <param name="request">El token ID enviado desde el frontend.</param>
    /// <returns>Información del usuario autenticado y sus permisos.</returns>
    [HttpPost("microsoft-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> MicrosoftLogin([FromBody] MicrosoftLoginRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.IdToken))
        {
            return BadRequest(new { message = "El token de Microsoft es obligatorio." });
        }

        var response = await _authService.LoginWithMicrosoftAsync(request);

        if (response == null)
        {
            return Unauthorized(new { message = "Acceso denegado. El usuario no está registrado en el sistema institucional o su cuenta está inactiva." });
        }

        // Guardar el JWT en una cookie HttpOnly para compatibilidad local
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddHours(8)
        };

        Response.Cookies.Append("diitra_auth", response.Token, cookieOptions);

        return Ok(response);
    }

    /// <summary>
    /// Inicia sesión utilizando un token de enlace mágico (Magic Link) de un solo uso.
    /// </summary>
    [HttpPost("magic-login")]
    [AllowAnonymous]
    public async Task<IActionResult> MagicLogin([FromBody] MagicLoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Token))
            return BadRequest(new { message = "El token es obligatorio." });

        byte[] tokenHashBytes;
        try
        {
            tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(request.Token));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Formato de token inválido.", detail = ex.Message });
        }
        var tokenHash = Convert.ToHexString(tokenHashBytes);

        var result = await _authService.ValidateAndConsumeMagicLinkAsync(tokenHash, HttpContext.Connection.RemoteIpAddress?.ToString(), Request.Headers["User-Agent"].ToString());

        if (result == null)
            return Unauthorized(new { message = "El enlace mágico es inválido, ya fue utilizado o ha expirado." });

        // NOTA DE ALTA SEGURIDAD: Ya no escribimos la cookie de sesión automáticamente aquí
        // para evitar iniciar sesión en navegadores/dispositivos usados únicamente como puente (ej. smartphones).
        // La sesión se establecerá explícitamente en el navegador que elija "Ir a mis Revisiones".

        return Ok(result);
    }

    /// <summary>
    /// Confirma la sesión del magic link en el dispositivo actual estableciendo la cookie HttpOnly.
    /// </summary>
    [HttpPost("magic-confirm")]
    [AllowAnonymous]
    public IActionResult MagicConfirm([FromBody] MagicConfirmRequest request)
    {
        if (string.IsNullOrEmpty(request.Token))
            return BadRequest(new { message = "El token es obligatorio." });

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddHours(8)
        };
        Response.Cookies.Append("diitra_auth", request.Token, cookieOptions);

        return Ok(new { success = true });
    }

    /// <summary>
    /// Reenvía un enlace mágico activo al correo especificado, si existe un arbitraje pendiente para este.
    /// </summary>
    [HttpPost("magic-resend")]
    [AllowAnonymous]
    public async Task<IActionResult> MagicResend([FromBody] MagicResendRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
            return BadRequest(new { message = "El correo electrónico es obligatorio." });

        try
        {
            var sent = await _authService.ResendMagicLinkAsync(request.Email);

            if (!sent)
            {
                return BadRequest(new { message = "No se encontró ningún arbitraje activo asignado a este correo electrónico." });
            }

            return Ok(new { message = "Se ha enviado un nuevo enlace de acceso a su correo electrónico." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Inicia sesión en un dispositivo secundario utilizando el PIN de handoff generado al consumir un enlace mágico.
    /// </summary>
    [HttpPost("magic-handoff")]
    [AllowAnonymous]
    public async Task<IActionResult> MagicHandoff([FromBody] HandoffLoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Pin))
            return BadRequest(new { message = "El código PIN es obligatorio." });

        try
        {
            var response = await _authService.ValidateAndConsumeHandoffPinAsync(request.Pin, HttpContext.Connection.RemoteIpAddress?.ToString());

            if (response == null)
                return Unauthorized(new { message = "El código PIN es inválido o ha expirado." });

            // Guardar el JWT en una cookie HttpOnly para compatibilidad local
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(8)
            };
            Response.Cookies.Append("diitra_auth", response.Token, cookieOptions);

            return Ok(response);
        }
        catch (IpLockoutException ex)
        {
            return StatusCode(429, new { message = ex.Message, segundosRestantes = ex.SegundosRestantes });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(429, new { message = ex.Message });
        }
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

    // ─────────────────────────────────────────────────────────────────────────
    //  RECUPERACIÓN DE CONTRASEÑA
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Solicita un enlace de recuperación de contraseña. El enlace se envía al correo
    /// institucional del usuario y expira en 30 minutos (un solo uso).
    /// SIEMPRE retorna 200 para evitar enumeración de usuarios.
    /// </summary>
    [HttpPost("recuperar-contrasenia")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    public async Task<IActionResult> SolicitarRecuperacion([FromBody] PasswordRecoveryRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request?.Identificador))
            return Ok(new { message = "Si el correo está registrado, recibirás un enlace en los próximos minutos." });

        var ip = HttpContext.Connection?.RemoteIpAddress?.ToString();
        await _authService.RequestPasswordRecoveryAsync(request.Identificador.Trim(), ip);

        // Siempre la misma respuesta, sin revelar si el usuario existe
        return Ok(new { message = "Si el correo está registrado, recibirás un enlace en los próximos minutos." });
    }

    /// <summary>
    /// Valida el token de recuperación de contraseña y retorna la contraseña original de SIGAFI.
    /// El token se consume en esta llamada (un solo uso).
    /// </summary>
    [HttpPost("ver-contrasenia")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> VerContrasenia([FromBody] JsonElement body)
    {
        var token = body.TryGetProperty("token", out var t) ? t.GetString() : null;

        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Token requerido." });

        var ip = HttpContext.Connection?.RemoteIpAddress?.ToString();
        var resultado = await _authService.ValidatePasswordRecoveryTokenAsync(token, ip);

        if (!resultado.Valido)
            return BadRequest(new { message = "El enlace ha expirado o ya fue utilizado. Solicita uno nuevo." });

        if (resultado.EsHashInaccesible)
            return Ok(new
            {
                valido = true,
                esHashInaccesible = true,
                nombre = resultado.NombreUsuario,
                message = "Tu contraseña está almacenada de forma encriptada en el sistema institucional y no puede ser recuperada. Contacta al administrador para restablecerla."
            });

        return Ok(new
        {
            valido = true,
            esHashInaccesible = false,
            nombre = resultado.NombreUsuario,
            password = resultado.Password
        });
    }
}
