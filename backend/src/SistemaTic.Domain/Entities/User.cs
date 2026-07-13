namespace SistemaTic.Domain.Entities;

public class User
{
	public int Id { get; set; }
	public string Name { get; set; }
	public string Email { get; set; }
	public string Hashed_password { get; set; }
	public bool Active { get; set; }
	public bool ChangePassword { get; set; }
	public int RoleId { get; set; }
	public DateTimeOffset CreatedAt { get; set; }
	public DateTimeOffset UpdatedAt { get; set; }

	public User(int id, string name, string email, string hashed_password,
		   bool active, bool changePassword, int roleId, DateTimeOffset createdAt,
		   DateTimeOffset? updatedAt) {
		this.Id = id;
		this.Name = name;
		this.Email = email;
		this.Hashed_password = hashed_password;
		this.Active = active;
		this.ChangePassword = changePassword;
		this.RoleId = roleId;
		this.CreatedAt = createdAt;
		this.UpdatedAt = UpdatedAt;
	}
}
