import { game } from "../engine/game";
import { format } from "../engine/format";
import { combatReadout } from "../engine/combat";

export function FoePanel() {
  const { state } = game;
  const readout = combatReadout(state);
  const hpPct = Math.max(0, Math.min(100, state.current.hp.div(state.current.maxHp).mul(100).toNumber()));
  return (
    <section className="panel">
      <h2 className="panel__title">[ The Foe ]</h2>
      <div className="row">
        <span className="muted">HP</span>
        <span>
          {format(state.current.hp)} / {format(state.current.maxHp)}
        </span>
      </div>
      <div className="hp">
        <div className="hp__fill" style={{ width: `${hpPct}%` }} />
      </div>
      <div className="row">
        <span className="muted">Tier</span>
        <span>{state.current.tier}</span>
      </div>
      <div className="row">
        <span className="muted">Soul Value</span>
        <span>{format(state.current.soulValue)}</span>
      </div>
      <div className="row">
        <span className="muted">Absorb Rate</span>
        <span>{readout.absorbRate.mul(100).toFixed(2)}%</span>
      </div>
    </section>
  );
}
