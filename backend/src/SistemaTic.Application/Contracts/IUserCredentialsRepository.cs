using SistemaTic.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SistemaTic.Application.Contracts;

public interface IUserCredentialsRepository
{
    public Task<UserCredentials?> GetUserCredentialsAsync(Guid userId);
    public Task<UserCredentials?> UpdateUserCredentialsAsync(UserCredentials credentials);
}
