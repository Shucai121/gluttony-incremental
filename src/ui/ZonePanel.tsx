import { game } from "../engine/game";
import { format } from "../engine/format";
import { advanceZone, canAdvanceZone, maxSafeZone, zoneKillRequirement } from "../engine/zones";
import { Tooltip } from "./Tooltip";

export function ZonePanel() {
  const { state } = game;
  return (
    <section className="panel">
      <h2 className="panel__title">[ The Hunt ]</h2>
      <Tooltip id="zone">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Zone</span>
          <span>
            {state.zone} / {state.maxZone}
          </span>
        </div>
      </Tooltip>
      <div className="row">
        <span className="muted">Safe Depth</span>
        <span>{maxSafeZone(state)}</span>
      </div>
      <div className="row">
        <span className="muted">Next Zone</span>
        <span>{format(zoneKillRequirement(state.zone + 1))} kills</span>
      </div>
      <Tooltip id="advance-zone">
        <button className="btn" disabled={!canAdvanceZone(state)} onClick={() => advanceZone(state)}>
          Advance Zone
        </button>
      </Tooltip>
    </section>
  );
}
