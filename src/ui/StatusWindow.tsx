import type { CSSProperties } from "react";
import { game, hardReset } from "../engine/game";
import { useRender } from "../state/store";
import { format } from "../engine/format";

export function StatusWindow() {
  useRender((s) => s.frame); // subscribe: re-render each tick
  const { state, ticks } = game;

  return (
    <div style={panel}>
      <h1 style={title}>[ STATUS ]</h1>
      <Row label="Souls" value={format(state.souls)} />
      <Row label="Ticks" value={ticks.toLocaleString()} />
      <Row label="Hunger" value={`${state.hunger.toFixed(0)} / ${state.hungerMax}`} />
      <button style={btn} onClick={() => hardReset()}>
        Hard Reset
      </button>
      <p style={footer}>Phase 1 scaffold — combat &amp; devour arrive in Phase 2.</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={row}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const panel: CSSProperties = {
  width: 320,
  padding: 20,
  borderRadius: 10,
  border: "1px solid #2b6cb0",
  background: "rgba(20, 40, 70, 0.55)",
  boxShadow: "0 0 24px rgba(43, 108, 176, 0.35)",
  backdropFilter: "blur(4px)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const title: CSSProperties = { margin: 0, letterSpacing: 3, fontSize: 18, textAlign: "center" };
const row: CSSProperties = { display: "flex", justifyContent: "space-between", fontVariantNumeric: "tabular-nums" };
const btn: CSSProperties = {
  marginTop: 6,
  padding: "8px 12px",
  background: "transparent",
  color: "#cfe3ff",
  border: "1px solid #2b6cb0",
  borderRadius: 6,
  cursor: "pointer",
};
const footer: CSSProperties = { opacity: 0.5, fontSize: 12, margin: 0, textAlign: "center" };
