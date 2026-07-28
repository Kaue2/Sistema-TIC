export function DecorativeBackground() {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 translate-y-[-85%] overflow-hidden max-w-[calc(100vw)]"
      aria-hidden="true"
    >
      <div className="h-360 w-560 rounded-b-full bg-blue-100 opacity-4 translate-x-[-13%]"  />
    </div>
  );
}
