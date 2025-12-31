'use client';

interface SearchBoxProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SearchBox({
  placeholder = 'Search...',
  value,
  onChange,
}: SearchBoxProps) {
  return (
    <div className="hidden md:block">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="
            w-64 pl-4 pr-4 py-2 text-sm rounded-lg
            border border-[var(--border-color)]
            bg-[var(--form-body-bg)]
            text-[var(--form-text-color)]
            placeholder-[var(--form-text-caption)]
            focus:outline-none focus:ring-2
            focus:ring-[var(--link-color)]
            focus:border-transparent
          "
        />
      </div>
    </div>
  );
}
