import { game } from "../engine/game";
import { format } from "../engine/format";
import { canTranscend, divinityGain, transcend } from "../engine/transcendence";
import { Tooltip } from "./Tooltip";

export function TranscendencePanel() {
  const { state } = game;
  return (
    <section className="panel">
      <Tooltip id="transcendence">
        <h2 className="panel__title">[ God's Domain ]</h2>
      </Tooltip>
      <div className="row">
        <Tooltip id="divinity">
          <span className="muted">Divinity</span>
        </Tooltip>
        <span>{format(state.divinity)}</span>
      </div>
      <div className="row">
        <span className="muted">Transcendences</span>
        <span>{format(state.transcendences)}</span>
      </div>
      <div className="row">
        <span className="muted">Next Transcendence</span>
        <span>+{format(divinityGain(state))}</span>
      </div>
      <Tooltip id="transcendence">
        <button className="btn" disabled={!canTranscend(state)} onClick={() => transcend(state)}>
          Transcend
        </button>
      </Tooltip>
    </section>
  );
}
