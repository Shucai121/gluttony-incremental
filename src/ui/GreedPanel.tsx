import { game } from "../engine/game";
import { format } from "../engine/format";
import { STAT_ORDER } from "../state/types";
import { GreedForm } from "../content/greed";
import {
  advanceForm,
  canAdvanceForm,
  canTriggerBloodBurst,
  currentGreedForm,
  greedMult,
  nextGreedForm,
  triggerBloodBurst,
} from "../engine/greed";
import { Tooltip } from "./Tooltip";

function greedStatCost(form: GreedForm): string {
  const costs = STAT_ORDER.filter((stat) => form.unlockCost.stats[stat].gt(0)).map(
    (stat) => `${stat} ${format(form.unlockCost.stats[stat])}`,
  );
  return costs.length > 0 ? costs.join(" · ") : "—";
}

export function GreedPanel() {
  const { state } = game;
  const form = currentGreedForm(state);
  const next = nextGreedForm(state);
  return (
    <section className="panel">
      <Tooltip id="greed-form">
        <h2 className="panel__title">[ Greed ]</h2>
      </Tooltip>
      <div className="row">
        <span className="muted">Form</span>
        <span>{form.name}</span>
      </div>
      <div className="row">
        <span className="muted">Damage</span>
        <span>x{format(greedMult(state))}</span>
      </div>
      <div className="row">
        <span className="muted">Blood Charge</span>
        <span>{format(state.greed.bloodCharge)}</span>
      </div>
      {next ? (
        <>
          <div className="row">
            <span className="muted">Next</span>
            <span>{next.name}</span>
          </div>
          <div className="row">
            <span className="muted">Soul Cost</span>
            <span>{format(next.unlockCost.souls)}</span>
          </div>
          <div className="row">
            <span className="muted">Blood Cost</span>
            <span>{greedStatCost(next)}</span>
          </div>
          <Tooltip id="advance-form">
            <button className="btn" disabled={!canAdvanceForm(state)} onClick={() => advanceForm(state)}>
              Advance Form
            </button>
          </Tooltip>
        </>
      ) : (
        <div className="row">
          <span className="muted">Next</span>
          <span>Max Form</span>
        </div>
      )}
      <Tooltip id="blood-burst">
        <button className="btn" disabled={!canTriggerBloodBurst(state)} onClick={() => triggerBloodBurst(state)}>
          Blood Burst
        </button>
      </Tooltip>
    </section>
  );
}
