using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SistemaTic.Application;
using SistemaTic.Application.Services;
using SistemaTic.Application.DTO;
using SistemaTic.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace SistemaTic.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
        this._userService = userService;
    }

    [HttpGet("get-users")]
    public async Task<IEnumerable<User>> GetUsers()
    {
        return await this._userService.GetAllUsersAsync();
    }

    [HttpPost("create-user")]
    public async Task<IActionResult> CreateUser(CreateUserDTO dto)
    {
        Guid id = await this._userService.CreateUser(dto);
        return Ok(id);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangeUserPassword(ChangeUserPasswordDTO dto)
    {
        UserCredentials credentials = await this._userService.ChangeUserPasswordAsync(dto);
        return Ok(credentials.UserId);
    }

    [HttpPost("change-role")]
    [Authorize(Roles = "coordinator,administrator")]
    public async Task<IActionResult> ChangeUserRole(ChangeUserRoleDTO dto)
    {
        User user = await this._userService.ChangeUserRoleAsync(dto);
        return Ok(user);
    }
}
