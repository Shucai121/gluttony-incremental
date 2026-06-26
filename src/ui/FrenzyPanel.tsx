import { game } from "../engine/game";
import { format } from "../engine/format";
import { sinEssenceGain } from "../engine/prestige";
import { canFeedingFrenzy, feedingFrenzy } from "../engine/reset";
import { rankMult, rankName } from "../engine/ranks";
import { hungerRatio } from "../engine/hunger";
import { Tooltip } from "./Tooltip";

export function FrenzyPanel() {
  const { state } = game;
  const projected = sinEssenceGain(state.souls, hungerRatio(state));
  return (
    <section className="panel">
      <Tooltip id="feeding-frenzy">
        <h2 className="panel__title">[ Feeding Frenzy ]</h2>
      </Tooltip>
      <div className="row">
        <Tooltip id="sin-essence">
          <span className="muted">Sin Essence</span>
        </Tooltip>
        <span>{format(state.sinEssence)}</span>
      </div>
      <div className="row">
        <Tooltip id="devourer-rank">
          <span className="muted">Devourer Rank</span>
        </Tooltip>
        <span>
          {rankName(state)} (x{format(rankMult(state))})
        </span>
      </div>
      <div className="row">
        <span className="muted">Next Frenzy</span>
        <span>+{format(projected)}</span>
      </div>
      <Tooltip id="feeding-frenzy">
        <button className="btn" disabled={!canFeedingFrenzy(state)} onClick={() => feedingFrenzy(state)}>
          Feeding Frenzy
        </button>
      </Tooltip>
    </section>
  );
}
