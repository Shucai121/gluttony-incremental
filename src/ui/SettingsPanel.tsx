import { game, hardReset } from "../engine/game";
import { Notation, setNotation } from "../engine/format";
import { Tooltip } from "./Tooltip";

const NOTATIONS: Notation[] = ["scientific", "engineering", "standard"];

export function SettingsPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <Tooltip id="settings">
        <h2 className="panel__title">[ Settings ]</h2>
      </Tooltip>

      <div className="row" style={{ width: "100%" }}>
        <span className="muted">Notation</span>
        <select
          className="btn"
          value={state.settings.notation}
          onChange={(e) => {
            const n = e.target.value as Notation;
            state.settings.notation = n;
            setNotation(n);
          }}
        >
          {NOTATIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="row" style={{ width: "100%" }}>
        <span className="muted">Autosave (sec)</span>
        <input
          className="btn"
          type="number"
          min={1}
          max={300}
          style={{ width: 72 }}
          value={state.settings.autosaveSec}
          onChange={(e) => {
            const v = Math.max(1, Math.min(300, Math.floor(Number(e.target.value) || 1)));
            state.settings.autosaveSec = v;
          }}
        />
      </div>

      <div className="row" style={{ width: "100%" }}>
        <span className="muted">Offline progress</span>
        <button
          className="btn"
          onClick={() => {
            state.settings.offlineProgress = !state.settings.offlineProgress;
          }}
        >
          {state.settings.offlineProgress ? "On" : "Off"}
        </button>
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
