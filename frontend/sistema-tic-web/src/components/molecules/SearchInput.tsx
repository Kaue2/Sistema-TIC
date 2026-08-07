type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Pesquise aqui",
  onClear,
  className = "max-w-95",
}: SearchInputProps) {
  function handleClear() {
    onClear?.();
  }

  return (
    <div className={`relative w-full ${className}`}>
      <span
        className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-40"
        style={{ fontSize: 20 }}
      >
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-black-20 bg-card-background pl-10 pr-9 text-sm text-black-80 outline-none transition-all duration-200 placeholder:text-black-40 hover:border-blue-100 focus:border-blue-100 focus:ring-1 focus:ring-blue-100"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar pesquisa"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-black-40 transition-colors hover:text-black-80"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
          >
            close
          </span>
        </button>
      )}
    </div>
  );
}
