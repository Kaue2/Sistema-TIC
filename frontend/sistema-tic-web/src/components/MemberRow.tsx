import { useNavigate } from "react-router-dom";
import { Avatar } from "./Avatar";
import { JourneySchedule } from "./JourneySchedule";
import type { Member } from "../pages/MembersPage";

type MemberCardProps = {
  member: Member;
};

export function MemberCard({ member }: MemberCardProps) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/profile/${member.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver perfil de ${member.fullName}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="flex w-full min-h-87.5 max-h-87.5 cursor-pointer items-stretch gap-6 rounded-2xl border border-blue-40 bg-card-background transition-all duration-200 hover:border-blue-100 hover:bg-blue-100/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
    >
      <div className="pl-6 py-6 self-center">
        <Avatar
          avatarUrl={member.avatar}
          fullName={member.fullName}
          size="lg"
        />
      </div>

      <div className="flex-1 min-w-0 py-6 self-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-[32px] font-medium leading-none text-black-80">
            {member.fullName || "-"}
          </h3>
          <p className="text-lg text-black-60">{member.role || "-"}</p>
        </div>

        <div className="mt-6">
          <h4 className="text-xl font-medium text-black-80">
            E-mails
          </h4>
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex gap-1 flex-wrap">
              <span className="text-base text-black-60">
                Institucional:
              </span>
              <a
                href={`mailto:${member.institutionalEmail}`}
                className="text-base text-blue-100 transition-colors"
              >
                {member.institutionalEmail || "-"}
              </a>
            </div>

            <div className="flex gap-1 flex-wrap">
              <span className="text-base text-black-60">
                Administrativo:
              </span>
              <a
                href={`mailto:${member.administrativeEmail}`}
                className="text-base text-blue-100 transition-colors"
              >
                {member.administrativeEmail || "-"}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="self-stretch w-px bg-blue-40" />

      <div className="w-80 shrink-0 pr-6 py-6">
        <JourneySchedule
          totalHours="25 horas"
          location={member.location}
          schedule={member.journeys}
          editable={false}
          bordered={false}
        />
      </div>
    </div>
  );
}
