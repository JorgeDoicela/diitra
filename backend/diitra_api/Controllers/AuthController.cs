using Microsoft.AspNetCore.Mvc;
using diitra_application.Security;
using diitra_application.Security.DTOs;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Autentica a un usuario y genera una cookie HttpOnly con el JWT.
    /// </summary>
    /// <param name="request">Credenciales del usuario (usuario y contraseña).</param>
    /// <returns>Información del usuario autenticado y sus permisos.</returns>
    /// <response code="200">Login exitoso.</response>
    /// <response code="401">Credenciales incorrectas.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);

        if (response == null)
        {
            return Unauthorized(new { message = "Credenciales incorrectas" });
        }

        var token = _authService.GenerateToken(response);

        // Guardar el JWT en una cookie HttpOnly
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // En localhost lo dejamos en false si no hay SSL
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddHours(12)
        };

        Response.Cookies.Append("diitra_auth", token, cookieOptions);

        return Ok(response);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("diitra_auth");
        return Ok(new { message = "Sesión cerrada correctamente" });
    }

    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var idReferencia = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var nombre = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
            var tipo = User.FindFirst("tipo_usuario")?.Value;
            var isAdmin = User.FindFirst("es_admin")?.Value == "true";
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
}
