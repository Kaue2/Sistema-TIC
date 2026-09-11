using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public record TrackMemberSummary(string FullName, string Email);

public interface ITrackTeamMemberRepository
{
    public Task<IEnumerable<TrackTeamMember>> GetByTrackIdAsync(Guid trackId);
    public Task<IEnumerable<TrackMemberSummary>> GetActiveMembersAsync(Guid trackId, string responsibility);
    public Task<TrackTeamMember> CreateAsync(
        Guid trackId,
        Guid userId,
        string responsibility,
        bool isLead,
        DateOnly? startsOn,
        Guid assignedByUserId);
}
