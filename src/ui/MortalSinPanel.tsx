import { game } from "../engine/game";
import { format } from "../engine/format";
import { canMortalSin, mortalSinAwaken, mortalSinGain } from "../engine/mortalSin";
import { Tooltip } from "./Tooltip";

export function MortalSinPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <Tooltip id="mortal-sin">
        <h2 className="panel__title">[ Mortal Sin ]</h2>
      </Tooltip>
      <div className="row">
        <Tooltip id="sins">
          <span className="muted">Sins</span>
        </Tooltip>
        <span>{format(state.sins)}</span>
      </div>
      <div className="row">
        <span className="muted">Mortal Sins</span>
        <span>{format(state.mortalSins)}</span>
      </div>
      <div className="row">
        <span className="muted">Next Awakening</span>
        <span>+{format(mortalSinGain(state))}</span>
      </div>
      <Tooltip id="mortal-sin">
        <button className="btn" disabled={!canMortalSin(state)} onClick={() => mortalSinAwaken(state)}>
          Mortal Sin Awaken
        </button>
      </Tooltip>
    </section>
  );
}
