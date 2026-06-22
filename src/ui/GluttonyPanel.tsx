import { game } from "../engine/game";
import { format } from "../engine/format";
import { awaken, canAwaken, canDigest, digest } from "../engine/reset";
import { Tooltip } from "./Tooltip";

export function GluttonyPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <h2 className="panel__title">[ Gluttony ]</h2>
      <Tooltip id="gluttony">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Gluttony Lv</span>
          <span>{format(state.gluttonyLevel)}</span>
        </div>
      </Tooltip>
      <div className="row">
        <span className="muted">Awakenings</span>
        <span>{format(state.awakenings)}</span>
      </div>
      <Tooltip id="digest">
        <button className="btn" disabled={!canDigest(state)} onClick={() => digest(state)}>
          Digest
        </button>
      </Tooltip>
      <Tooltip id="awaken">
        <button className="btn" disabled={!canAwaken(state)} onClick={() => awaken(state)}>
          Awaken
        </button>
      </Tooltip>
    </section>
  );
}
