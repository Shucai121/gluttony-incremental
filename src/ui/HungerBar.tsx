export function HungerBar({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const full = ratio >= 1;
  return (
    <div
      className={"meter" + (full ? " meter--full" : "")}
      role="meter"
      aria-label="Hunger"
      aria-valuenow={Math.round(ratio * 100)}
    >
      <div className="meter__fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}
