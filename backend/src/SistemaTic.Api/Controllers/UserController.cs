using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SistemaTic.Application.Services;
using SistemaTic.Domain.Entities;

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

    [HttpGet]
    public async Task<IEnumerable<User>> GetUsers()
    {
        return await this._userService.GetAllUsersAsync();
    }
}
