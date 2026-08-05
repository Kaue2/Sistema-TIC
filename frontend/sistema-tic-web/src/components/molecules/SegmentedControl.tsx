import { useEffect, useRef, useState } from "react";

export type SegmentedOption = {
  label: string;
  value: string;
  icon?: string;
};

type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string | null;
  onChange: (value: string) => void;
  fill?: boolean;
};

export function SegmentedControl({
  options,
  value,
  onChange,
  fill = false,
}: SegmentedControlProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const activeIndex = options.findIndex((o) => o.value === value);

  useEffect(() => {
    const button = buttonRefs.current[activeIndex];
    if (button) {
      setIndicatorStyle({
        left: button.offsetLeft - 1,
        width: button.offsetWidth,
      });
    } else {
      setIndicatorStyle(null);
    }
  }, [activeIndex, options]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (activeIndex < 0) return;
    let nextIndex: number;
    if (e.key === "ArrowRight") {
      nextIndex = (activeIndex + 1) % options.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (activeIndex - 1 + options.length) % options.length;
    } else {
      return;
    }
    e.preventDefault();
    onChange(options[nextIndex].value);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Seleção"
      onKeyDown={handleKeyDown}
      className={`relative flex rounded-lg border border-black-20 bg-card-background p-0.75 ${fill ? "w-full" : ""}`}
    >
      {indicatorStyle && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-md bg-blue-100/10 transition-all duration-300 ease-out"
          style={indicatorStyle}
        />
      )}

      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex h-8 items-center justify-start gap-2 rounded-md px-4 text-sm whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 ${
              fill ? "min-w-0 flex-1" : ""
            } ${
              isActive ? "text-blue-100" : "text-black-60 hover:text-blue-100"
            }`}
          >
            {option.icon && (
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 18,
                  fontVariationSettings: `'FILL' ${isActive ? 1 : 0}`,
                }}
              >
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
