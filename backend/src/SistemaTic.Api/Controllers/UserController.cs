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
    public async Task<IActionResult> CreateUser(UserDTO dto)
    {
        int id = await this._userService.CreateUser(dto);
        return Ok(id);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<String> ChangeUserPassword()
    {
        string result = "all right";
        return result;
    }
}
