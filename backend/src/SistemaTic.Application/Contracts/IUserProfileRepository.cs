using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface IUserProfileRepository
{
    public Task<UserProfile?> GetByUserIdAsync(Guid userId);
    public Task<UserProfile> UpsertAsync(
        Guid userId,
        string? preferredName,
        Guid? photoFileId,
        string? workLocation,
        int? weeklyWorkloadMinutes,
        string? biography,
        string? lattesUrl,
        Guid? knowledgeAreaId);
}
