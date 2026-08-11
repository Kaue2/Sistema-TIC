type CharacterCounterProps = {
  length: number;
  max: number;
};

export function CharacterCounter({ length, max }: CharacterCounterProps) {
  const isOverLimit = length > max;

  return (
    <span
      className={`text-xs ${isOverLimit ? "text-red-100" : "text-black-60"}`}
    >
      {length}/{max} caracteres
    </span>
  );
}
