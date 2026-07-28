import { useNavigate } from "react-router-dom";
import { Avatar } from "./Avatar";
import type { Member } from "../pages/MembersPage";

type MemberListItemProps = {
  member: Member;
};

export function MemberListItem({ member }: MemberListItemProps) {
  const navigate = useNavigate();

  const displayEmail = member.administrativeEmail || member.institutionalEmail;

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
      className="flex w-full max-w-225 cursor-pointer items-center gap-4 rounded-2xl border border-blue-40 bg-card-background px-6 py-5 transition-all duration-200 hover:border-blue-100 hover:bg-blue-100/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
    >
      <Avatar
        avatarUrl={member.avatar}
        fullName={member.fullName}
        size="sm"
      />

      <div className="flex flex-col gap-0.5">
        <span className="text-base font-medium text-black-80">
          {member.fullName}
        </span>
        <span className="text-sm text-black-60">
          {member.role}
          <span className="mx-1.5 text-black-40">·</span>
          <span className="text-blue-100 underline decoration-blue-100 underline-offset-2">
            {displayEmail}
          </span>
        </span>
      </div>
    </div>
  );
}
