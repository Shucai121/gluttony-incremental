import { game } from "../engine/game";
import { D } from "../engine/decimal";
import { format } from "../engine/format";
import { combatReadout } from "../engine/combat";
import { rankName } from "../engine/ranks";
import { currentGreedForm } from "../engine/greed";
import { INITIAL_STATS } from "../content/stats";
import { titleById } from "../content/titles";
import { STAT_ORDER } from "../state/types";
import { HungerBar } from "./HungerBar";
import { Tooltip } from "./Tooltip";

export function StatusPanel() {
  const { state } = game;
  const readout = combatReadout(state);
  const activeTitle = state.titles.active ? titleById(state.titles.active)?.name : null;

  return (
    <section className="panel">
      <h2 className="panel__title">[ Status Window ]</h2>

      <div className="row" style={{ width: "100%" }}>
        <span className="muted">Devourer Rank</span>
        <span className="badge">{rankName(state)}</span>
      </div>
      {activeTitle && (
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Title</span>
          <span>{activeTitle}</span>
        </div>
      )}
      <div className="row" style={{ width: "100%" }}>
        <span className="muted">Greed</span>
        <span>{currentGreedForm(state).name}</span>
      </div>

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

      <div className="statsheet">
        {STAT_ORDER.map((stat) => {
          const st = state.stats[stat];
          const base = D(INITIAL_STATS[stat]);
          const absorbed = st.value.sub(st.trained).sub(base).max(0);
          return (
            <Tooltip id={`stat-${stat}`} key={stat}>
              <div className="statsheet__row">
                <span className="muted">{stat}</span>
                <span>
                  {format(st.value)}
                  <span className="statsheet__sub">
                    {" "}
                    ({format(st.trained)}t / {format(absorbed)}a)
                  </span>
                </span>
              </div>
            </Tooltip>
          );
        })}
      </div>

      <Tooltip id="hunger">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="muted">Hunger</span>
          <HungerBar value={state.hunger} max={state.hungerMax} />
        </div>
      </Tooltip>
    </section>
  );
}
