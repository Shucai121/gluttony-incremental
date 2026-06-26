import { game } from "../engine/game";
import { format } from "../engine/format";
import { APPRAISAL } from "../content/appraisal";
import {
  appraisalCost,
  appraisalLevel,
  appraisalZoneCap,
  buyAppraisal,
  canBuyAppraisal,
} from "../engine/appraisal";
import { Tooltip } from "./Tooltip";

export function AppraisalPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <Tooltip id="appraisal">
        <h2 className="panel__title">[ Appraisal ]</h2>
      </Tooltip>
      <div className="row">
        <span className="muted">Zone Depth</span>
        <span>0 – {appraisalZoneCap(state)}</span>
      </div>
      {APPRAISAL.map((node) => (
        <div className="row" key={node.id}>
          <Tooltip id={`appraisal-${node.id}`}>
            <span className="muted">
              {node.name} · Lv {appraisalLevel(state, node.id)}
            </span>
          </Tooltip>
          <button
            className="btn"
            disabled={!canBuyAppraisal(state, node.id)}
            onClick={() => buyAppraisal(state, node.id)}
          >
            {format(appraisalCost(state, node.id))}
          </button>
        </div>
      ))}
    </section>
  );
}
