namespace SistemaTic.Application.Contracts;

public interface ITokenGenerator
{
	public string Generate(int userId, string email, string role);	
}
