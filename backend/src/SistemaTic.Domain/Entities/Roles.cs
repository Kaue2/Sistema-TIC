namespace SistemaTic.Domain;

public class Roles
{
	public int Id { get; set; }
	public string Code { get; set; }
	public string Name { get; set; }
	public string Description { get; set; }

	public Roles(int id, string code, string name, string description)
	{
		this.Id = id;
		this.Code = code;
		this.Name = name;
		this.Description = description;
	}
}
