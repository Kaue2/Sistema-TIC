type TrailProgressRingProps = {
  label: string;
  value: number;
  featured?: boolean;
  size?: "sm" | "md";
};

export function TrailProgressRing({
  label,
  value,
  featured = false,
  size = "md",
}: TrailProgressRingProps) {
  const isCompact = size === "sm";
  const circleSize = featured
    ? "size-[228px]"
    : isCompact
      ? "size-[88px]"
      : "size-[188px]";
  const valueSize = featured
    ? "text-[32px]"
    : isCompact
      ? "text-base leading-none"
      : "text-[28px]";
  const trackClass = featured
    ? "absolute inset-[14px] rounded-full border-[8px] border-black-40"
    : isCompact
      ? "absolute inset-[7px] rounded-full border-[5px] border-black-40"
      : "absolute inset-[14px] rounded-full border-[8px] border-black-40";
  const holeClass = featured
    ? "absolute inset-[28px] rounded-full bg-card-background"
    : isCompact
      ? "absolute inset-[14px] rounded-full bg-card-background"
      : "absolute inset-[28px] rounded-full bg-card-background";

  return (
    <div className="flex flex-col items-center text-center">
      <div
        role="img"
        aria-label={`${label}: ${value}% concluído`}
        className={`relative shrink-0 ${circleSize}`}
      >
        <span aria-hidden="true" className={trackClass} />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(#002688 0% ${value}%, transparent ${value}% 100%)`,
          }}
        />
        <span aria-hidden="true" className={holeClass} />
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center font-normal text-black-80 ${valueSize}`}
        >
          {value}%
        </span>
      </div>

      <p
        className={
          isCompact
            ? "mt-2 text-sm leading-none text-black-80"
            : "mt-5 text-sm leading-none text-black-80"
        }
      >
        {label}
      </p>
    </div>
  );
}
