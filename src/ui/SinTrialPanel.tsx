import { game } from "../engine/game";
import { format } from "../engine/format";
import { SINS, sinById } from "../content/sins";
import { canEnterTrial, enterTrial, exitTrial, isInTrial, isTrialCleared } from "../engine/sinTrial";
import { Tooltip } from "./Tooltip";

function ActiveTrial() {
  const { state } = game;
  const sin = sinById(state.activeTrial!);
  if (!sin) return null;
  return (
    <div className="subpanel">
      <h3 className="panel__subtitle">Trial: {sin.name}</h3>
      <div className="row">
        <span className="muted">Constraint</span>
        <span>{sin.constraintText}</span>
      </div>
      <div className="row">
        <span className="muted">Kills</span>
        <span>
          {format(state.totalKills)} / {format(sin.clearKills)}
        </span>
      </div>
      <button className="btn" onClick={() => exitTrial(state)}>
        Abandon Trial
      </button>
    </div>
  );
}

export function SinTrialPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <Tooltip id="sin-trials">
        <h2 className="panel__title">[ Sin Trials ]</h2>
      </Tooltip>
      {isInTrial(state) ? (
        <ActiveTrial />
      ) : (
        SINS.map((sin) => (
          <div className="row" key={sin.id}>
            <Tooltip id={`sin-${sin.id}`}>
              <span className="muted">
                {sin.name}
                {isTrialCleared(state, sin.id) ? " ✓" : ""}
              </span>
            </Tooltip>
            <button
              className="btn"
              disabled={!canEnterTrial(state, sin.id)}
              onClick={() => enterTrial(state, sin.id)}
            >
              {isTrialCleared(state, sin.id) ? "Re-enter" : "Enter"}
            </button>
          </div>
        ))
      )}
    </section>
  );
}
