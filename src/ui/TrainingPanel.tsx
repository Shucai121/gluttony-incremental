import { game } from "../engine/game";
import { format } from "../engine/format";
import { STAT_ORDER, StatId } from "../state/types";
import { buyFrenzy, buyMaxFrenzy, buyMaxTraining, buyTraining, frenzyCost, trainingCost } from "../engine/training";
import { Tooltip } from "./Tooltip";

function StatCard({ stat }: { stat: StatId }) {
  const state = game.state;
  const cost = trainingCost(state, stat);
  return (
    <div className="stat-card">
      <div className="stat-card__top">
        <Tooltip id={`stat-${stat}`}>
          <strong>{stat}</strong>
        </Tooltip>
        <span>{format(state.stats[stat].value)}</span>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        Trained {format(state.stats[stat].trained)}
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        Cost {format(cost)}
      </div>
      <div className="actions">
        <button className="btn" disabled={state.souls.lt(cost)} onClick={() => buyTraining(state, stat)}>
          Buy
        </button>
        <button className="btn" disabled={state.souls.lt(cost)} onClick={() => buyMaxTraining(state, stat)}>
          Max
        </button>
      </div>
    </div>
  );
}

export function TrainingPanel() {
  const state = game.state;
  const cost = frenzyCost(state);
  return (
    <section className="panel">
      <h2 className="panel__title">[ Training ]</h2>
      <div className="stat-grid">
        {STAT_ORDER.map((stat) => (
          <StatCard key={stat} stat={stat} />
        ))}
      </div>
      <div className="row" style={{ alignItems: "center", marginTop: 6 }}>
        <Tooltip id="frenzy">
          <span>
            <strong>Frenzy</strong> <span className="muted">Bought {format(state.frenzyBought)} · Cost {format(cost)}</span>
          </span>
        </Tooltip>
        <span className="actions">
          <button className="btn" disabled={state.souls.lt(cost)} onClick={() => buyFrenzy(state)}>
            Buy
          </button>
          <button className="btn" disabled={state.souls.lt(cost)} onClick={() => buyMaxFrenzy(state)}>
            Max
          </button>
        </span>
      </div>
    </section>
  );
}
