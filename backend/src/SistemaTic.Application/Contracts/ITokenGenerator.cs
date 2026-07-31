namespace SistemaTic.Application.Contracts;

public interface ITokenGenerator
{
	public string Generate(Guid userId, string email, string role);	
}
