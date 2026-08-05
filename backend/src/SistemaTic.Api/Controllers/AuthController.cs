using Microsoft.AspNetCore.Http;
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
        public async Task<string> AuthenticateUser(AuthenticateUserDTO dto)
        {
            string? token = await this._authService.AuthenticateAsync(dto.Email, dto.Password);

            if (token is null)
                throw new Exception("Token gerado era nulo, erro.");

            return token;
        }
    }
}
