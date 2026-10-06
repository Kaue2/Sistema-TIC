using Microsoft.AspNetCore.Mvc;
using SistemaTic.Application.Services;
using SistemaTic.Application.DTO;

namespace MyApp.Namespace
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            this._authService = authService;
        }


        [HttpPost("login")]
        public async Task<ActionResult<AuthenticateResponseDTO>> AuthenticateUser(AuthenticateUserDTO dto)
        {
            AuthenticateResponseDTO response = await this._authService.AuthenticateAsync(dto.Email, dto.Password);
            return Ok(response);
        }

        // público de propósito: o access token já pode ter expirado quando o cliente renova
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(RefreshTokenRequestDTO dto)
        {
            RefreshResponseDTO? response = await this._authService.RefreshAsync(dto.RefreshToken);

            if (response is null)
                return Unauthorized(new { message = "Refresh token inválido ou expirado." });

            return Ok(response);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout(RefreshTokenRequestDTO dto)
        {
            await this._authService.LogoutAsync(dto.RefreshToken);
            return NoContent();
        }
    }
}
