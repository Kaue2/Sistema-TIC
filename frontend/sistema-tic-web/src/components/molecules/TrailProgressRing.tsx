type TrailProgressRingProps = {
  label: string;
  value: number;
  featured?: boolean;
};

export function TrailProgressRing({
  label,
  value,
  featured = false,
}: TrailProgressRingProps) {
  const circleSize = featured ? "size-[228px]" : "size-[188px]";
  const valueSize = featured ? "text-[32px]" : "text-[28px]";

  return (
    <div className="flex flex-col items-center text-center">
      <div
        role="img"
        aria-label={`${label}: ${value}% concluído`}
        className={`relative shrink-0 ${circleSize}`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-[14px] rounded-full border-[8px] border-black-40"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(#002688 0% ${value}%, transparent ${value}% 100%)`,
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-[28px] rounded-full bg-card-background"
        />
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center font-normal text-black-80 ${valueSize}`}
        >
          {value}%
        </span>
      </div>

      <p className="mt-5 text-sm leading-none text-black-80">{label}</p>
    </div>
  );
}
