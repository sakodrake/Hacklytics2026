import React from "react";

interface PreferredStyleSelectorProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function PreferredStyleSelector({
  options,
  value,
  onChange,
}: PreferredStyleSelectorProps) {
  return (
    <div
      className="flex flex-wrap gap-3"
      role="radiogroup"
      aria-label="Preferred Style"
    >
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2 text-sm transition-all text-white
              opacity-80 hover:opacity-100 hover:-translate-y-0.5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              ${
                selected
                  ? "opacity-100 border-primary ring-2 ring-primary/40 bg-white/10"
                  : "border-white/20"
              }
            `}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
