type MemberInfoProps = {
  fullName: string;
  role: string;
  institutionalEmail: string;
};

export function MemberInfo({
  fullName,
  role,
  institutionalEmail,
}: MemberInfoProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[32px] font-medium leading-none text-black-80">
        {fullName || "-"}
      </h3>
      <p className="text-lg text-black-60">{role || "-"}</p>
      <a
        href={`mailto:${institutionalEmail}`}
        className="text-base text-blue-100 underline decoration-blue-100 underline-offset-2 transition-colors hover:decoration-2"
      >
        {institutionalEmail || "-"}
      </a>
    </div>
  );
}
