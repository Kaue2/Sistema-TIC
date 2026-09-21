using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SistemaTic.Application.Services;
using SistemaTic.Application.DTO;
using SistemaTic.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;

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

    [HttpGet("members")]
    [Authorize]
    public async Task<IEnumerable<MemberSummaryDTO>> GetMembers()
    {
        return await this._userService.GetMembersAsync();
    }

    [HttpGet("{id:guid}/profile")]
    [Authorize]
    public async Task<IActionResult> GetUserProfile(Guid id)
    {
        return Ok(await this._userService.GetUserProfileAsync(id));
    }

    [HttpGet("{id:guid}/photo")]
    [Authorize]
    public async Task<IActionResult> GetUserPhoto(Guid id)
    {
        var photo = await this._userService.GetUserPhotoAsync(id);
        if (photo is null)
            return NotFound();

        return File(photo.Value.Content, photo.Value.MediaType, photo.Value.FileName);
    }

    [HttpPost("{id:guid}/photo")]
    [Authorize]
    public async Task<IActionResult> UploadUserPhoto(Guid id, IFormFile file)
    {
        Guid uploadedByUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        await using var stream = file.OpenReadStream();
        await this._userService.UploadUserPhotoAsync(id, stream, file.FileName, file.ContentType, file.Length, uploadedByUserId);

        return NoContent();
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
        string? email = User.FindFirstValue(ClaimTypes.Email);

        if (String.IsNullOrEmpty(email))
        {
            return Unauthorized("Email não encontrado no token.");
        }

        UserCredentials credentials = await this._userService.ChangeUserPasswordAsync(email, dto.OldPassword, dto.NewPassword, dto.ConfirmNewPassword);
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
