import { useId } from 'react';

interface RatingInputProps {
  label: string;
  description?: string | null;
  min: number;
  max: number;
  value: number | null;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export default function RatingInput({
  label,
  description,
  min,
  max,
  value,
  disabled = false,
  onChange,
}: RatingInputProps) {
  const labelId = useId();
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <p id={labelId} className="text-sm font-medium text-slate-200">
        {label}
      </p>
      {description && <p className="text-xs text-slate-400">{description}</p>}

      <div role="radiogroup" aria-labelledby={labelId} className="mt-2 flex gap-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`h-10 w-10 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}