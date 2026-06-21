import type { CSSProperties } from "react";
import { game, hardReset } from "../engine/game";
import { useRender } from "../state/store";
import { format } from "../engine/format";
import { STAT_ORDER, StatId } from "../state/types";
import { buyFrenzy, buyMaxFrenzy, buyMaxTraining, buyTraining, frenzyCost, trainingCost } from "../engine/training";
import { combatReadout } from "../engine/combat";

export function StatusWindow() {
  useRender((state) => state.frame);
  const { state, ticks } = game;
  const readout = combatReadout(state);
  const hpPct = Math.max(0, Math.min(100, state.current.hp.div(state.current.maxHp).mul(100).toNumber()));

  return (
    <main style={shell}>
      <section style={panel}>
        <h1 style={title}>[ STATUS ]</h1>
        <Row label="Souls" value={format(state.souls)} />
        <Row label="DPS" value={format(readout.dps)} />
        <Row label="Souls / Kill" value={format(readout.perKill)} />
        <Row label="Kills" value={format(state.totalKills)} />
        <Row label="Ticks" value={ticks.toLocaleString()} />
        <Row label="Hunger" value={`${state.hunger.toFixed(0)} / ${state.hungerMax}`} />
        <button style={btn} onClick={() => hardReset()}>
          Hard Reset
        </button>
      </section>

      <section style={panel}>
        <h2 style={subtitle}>Enemy</h2>
        <Row label="Tier" value={`${state.current.tier}`} />
        <Row label="HP" value={`${format(state.current.hp)} / ${format(state.current.maxHp)}`} />
        <div style={barOuter}>
          <div style={{ ...barInner, width: `${hpPct}%` }} />
        </div>
        <Row label="Soul Value" value={format(state.current.soulValue)} />
        <Row label="Absorb Rate" value={`${readout.absorbRate.mul(100).toFixed(2)}%`} />
      </section>

      <section style={panelWide}>
        <h2 style={subtitle}>Training</h2>
        <div style={statGrid}>
          {STAT_ORDER.map((stat) => (
            <StatControl key={stat} stat={stat} />
          ))}
        </div>
        <div style={frenzyRow}>
          <div>
            <strong>Frenzy</strong>
            <div style={smallText}>Bought {format(state.frenzyBought)} · Cost {format(frenzyCost(state))}</div>
          </div>
          <div style={actions}>
            <button style={btn} disabled={state.souls.lt(frenzyCost(state))} onClick={() => buyFrenzy(state)}>
              Buy
            </button>
            <button style={btn} disabled={state.souls.lt(frenzyCost(state))} onClick={() => buyMaxFrenzy(state)}>
              Max
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatControl({ stat }: { stat: StatId }) {
  const state = game.state;
  const cost = trainingCost(state, stat);
  return (
    <div style={statCard}>
      <div style={statTop}>
        <strong>{stat}</strong>
        <span>{format(state.stats[stat].value)}</span>
      </div>
      <div style={smallText}>Trained {format(state.stats[stat].trained)}</div>
      <div style={smallText}>Cost {format(cost)}</div>
      <div style={actions}>
        <button style={btn} disabled={state.souls.lt(cost)} onClick={() => buyTraining(state, stat)}>
          Buy
        </button>
        <button style={btn} disabled={state.souls.lt(cost)} onClick={() => buyMaxTraining(state, stat)}>
          Max
        </button>
      </div>
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

const shell: CSSProperties = {
  width: "min(920px, calc(100vw - 32px))",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
};

const panel: CSSProperties = {
  padding: 18,
  borderRadius: 8,
  border: "1px solid #2b6cb0",
  background: "rgba(20, 40, 70, 0.55)",
  boxShadow: "0 0 24px rgba(43, 108, 176, 0.28)",
  backdropFilter: "blur(4px)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const panelWide: CSSProperties = {
  ...panel,
  gridColumn: "1 / -1",
};

const title: CSSProperties = { margin: 0, letterSpacing: 3, fontSize: 18, textAlign: "center" };
const subtitle: CSSProperties = { margin: 0, fontSize: 16 };
const row: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, fontVariantNumeric: "tabular-nums" };
const btn: CSSProperties = {
  padding: "7px 10px",
  background: "rgba(12, 24, 42, 0.7)",
  color: "#cfe3ff",
  border: "1px solid #2b6cb0",
  borderRadius: 6,
  cursor: "pointer",
};
const barOuter: CSSProperties = { height: 10, borderRadius: 5, background: "rgba(255, 255, 255, 0.12)", overflow: "hidden" };
const barInner: CSSProperties = { height: "100%", background: "#d64545", transition: "width 80ms linear" };
const statGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 };
const statCard: CSSProperties = { border: "1px solid rgba(207, 227, 255, 0.18)", borderRadius: 8, padding: 10, display: "grid", gap: 6 };
const statTop: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8 };
const smallText: CSSProperties = { opacity: 0.7, fontSize: 12 };
const actions: CSSProperties = { display: "flex", gap: 8 };
const frenzyRow: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };
