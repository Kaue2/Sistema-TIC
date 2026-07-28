type EmptySearchProps = {
  onClear: () => void;
};

export function EmptySearch({ onClear }: EmptySearchProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span
        className="material-symbols-outlined text-black-40"
        style={{ fontSize: 80, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 80" }}
      >
        search_off
      </span>
      <h2 className="mt-6 text-2xl font-medium text-black-80">
        Nenhum membro encontrado
      </h2>
      <p className="mt-2 text-base text-black-60">
        Tente alterar sua pesquisa ou remover alguns filtros.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 flex h-9 items-center gap-2 rounded-lg border border-blue-100 px-4 text-sm text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
      >
        Limpar filtros
      </button>
    </div>
  );
}
