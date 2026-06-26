import { game } from "../engine/game";
import { format } from "../engine/format";
import { ACHIEVEMENTS } from "../content/achievements";
import { isUnlocked } from "../engine/achievements";
import { Tooltip } from "./Tooltip";

export function AchievementsPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <Tooltip id="achievements">
        <h2 className="panel__title">[ Achievements ]</h2>
      </Tooltip>
      {ACHIEVEMENTS.map((ach) => {
        const unlocked = isUnlocked(state, ach.id);
        return (
          <div className="row" key={ach.id}>
            <span className={unlocked ? "" : "muted"}>
              {ach.name} (×{format(ach.mult)})
            </span>
            <span className="muted">{unlocked ? ach.description : "Locked"}</span>
          </div>
        );
      })}
    </section>
  );
}
