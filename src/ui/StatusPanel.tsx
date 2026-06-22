import { game, hardReset } from "../engine/game";
import { format } from "../engine/format";
import { combatReadout } from "../engine/combat";
import { HungerBar } from "./HungerBar";
import { Tooltip } from "./Tooltip";

export function StatusPanel() {
  const { state, ticks } = game;
  const readout = combatReadout(state);
  return (
    <section className="panel">
      <h2 className="panel__title">[ Status ]</h2>
      <Tooltip id="souls">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Souls</span>
          <span>{format(state.souls)}</span>
        </div>
      </Tooltip>
      <Tooltip id="dps">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">DPS</span>
          <span>{format(readout.dps)}</span>
        </div>
      </Tooltip>
      <Tooltip id="kills">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Kills</span>
          <span>{format(state.totalKills)}</span>
        </div>
      </Tooltip>
      <Tooltip id="hunger">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="muted">Hunger</span>
          <HungerBar value={state.hunger} max={state.hungerMax} />
        </div>
      </Tooltip>
      <div className="row">
        <span className="muted">Ticks</span>
        <span>{ticks.toLocaleString()}</span>
      </div>
      <Tooltip id="hard-reset">
        <button
          className="btn"
          onClick={() => {
            if (confirm("Wipe ALL progress and begin the feast anew? This cannot be undone.")) hardReset();
          }}
        >
          Hard Reset
        </button>
      </Tooltip>
    </section>
  );
}
