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

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
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
        catch (Exception ex)
        {
            Console.WriteLine($"[FATAL ERROR] AuthController: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            if (ex.InnerException != null) Console.WriteLine($"[INNER] {ex.InnerException.Message}");

            return StatusCode(500, new 
            { 
                message = "Error interno del servidor", 
                detail = ex.Message,
                inner = ex.InnerException?.Message,
                stack = ex.StackTrace 
            });
        }
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
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var tipo = User.FindFirst("tipo_usuario")?.Value;

            return Ok(new
            {
                id_referencia = idReferencia,
                nombre_completo = nombre,
                role = role,
                tipo_usuario = tipo
            });
        }

        return Unauthorized();
    }
}
