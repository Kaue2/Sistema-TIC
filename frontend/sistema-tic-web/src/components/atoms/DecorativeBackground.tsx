export function DecorativeBackground() {
  return (
    <div
      className="pointer-events-none absolute top-0 left-1/2 translate-y-[-85%]"
      aria-hidden="true"
    >
      <div className="h-360 w-560 -translate-x-1/2 rounded-b-full bg-blue-100 opacity-4"  />
    </div>
  );
}
