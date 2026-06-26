import { game } from "../engine/game";
import { format } from "../engine/format";
import { PERKS } from "../content/perks";
import { buyPerk, canBuyPerk, ownsPerk } from "../engine/perks";
import { Tooltip } from "./Tooltip";

export function DomainPerkPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <Tooltip id="domain-perks">
        <h2 className="panel__title">[ Domain Perks ]</h2>
      </Tooltip>
      {PERKS.map((perk) => (
        <div className="row" key={perk.id}>
          <Tooltip id={`perk-${perk.id}`}>
            <span className="muted">
              {perk.name} (×{format(perk.mult)})
            </span>
          </Tooltip>
          {ownsPerk(state, perk.id) ? (
            <span>Owned</span>
          ) : (
            <button
              className="btn"
              disabled={!canBuyPerk(state, perk.id)}
              onClick={() => buyPerk(state, perk.id)}
            >
              {format(perk.cost)} Div
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
