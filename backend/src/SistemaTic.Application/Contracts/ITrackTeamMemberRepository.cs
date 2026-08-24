using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface ITrackTeamMemberRepository
{
    public Task<IEnumerable<TrackTeamMember>> GetByTrackIdAsync(Guid trackId);
    public Task<TrackTeamMember> CreateAsync(
        Guid trackId,
        Guid userId,
        string responsibility,
        bool isLead,
        DateOnly? startsOn,
        Guid assignedByUserId);
}
