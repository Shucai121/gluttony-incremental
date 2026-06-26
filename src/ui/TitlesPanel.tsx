import { game } from "../engine/game";
import { TITLES } from "../content/titles";
import { setTitle, titleUnlocked } from "../engine/titles";
import { Tooltip } from "./Tooltip";

export function TitlesPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <Tooltip id="titles">
        <h2 className="panel__title">[ Titles ]</h2>
      </Tooltip>
      {TITLES.map((title) => {
        const unlocked = titleUnlocked(state, title.id);
        const active = state.titles.active === title.id;
        return (
          <div className="row" key={title.id}>
            <span className={unlocked ? "" : "muted"}>{unlocked ? title.name : "???"}</span>
            {unlocked ? (
              active ? (
                <span>Active</span>
              ) : (
                <button className="btn" onClick={() => setTitle(state, title.id)}>
                  Wear
                </button>
              )
            ) : (
              <span className="muted">Locked</span>
            )}
          </div>
        );
      })}
    </section>
  );
}
