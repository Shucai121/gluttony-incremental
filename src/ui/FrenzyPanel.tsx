import { game } from "../engine/game";
import { format } from "../engine/format";
import { sinEssenceGain } from "../engine/prestige";
import { canFeedingFrenzy, feedingFrenzy } from "../engine/reset";
import { rankMult, rankName } from "../engine/ranks";
import { hungerRatio } from "../engine/hunger";
import { ESSENCE_UPGRADES } from "../content/essenceShop";
import {
  buyEssenceUpgrade,
  canBuyEssenceUpgrade,
  essenceUpgradeCost,
  essenceUpgradeLevel,
} from "../engine/essenceShop";
import { AUTOBUYERS } from "../content/autobuyers";
import {
  canUnlockAutobuyer,
  isAutobuyerActive,
  setAutobuyerEnabled,
  unlockAutobuyer,
} from "../engine/autobuyers";
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
      <EssenceShop />
      <Instincts />
    </section>
  );
}

function EssenceShop() {
  const { state } = game;
  return (
    <div className="subpanel">
      <Tooltip id="essence-shop">
        <h3 className="panel__subtitle">Sin Essence Shop</h3>
      </Tooltip>
      {ESSENCE_UPGRADES.map((upgrade) => (
        <div className="row" key={upgrade.id}>
          <span className="muted">
            {upgrade.name} · Lv {essenceUpgradeLevel(state, upgrade.id)}
          </span>
          <button
            className="btn"
            disabled={!canBuyEssenceUpgrade(state, upgrade.id)}
            onClick={() => buyEssenceUpgrade(state, upgrade.id)}
          >
            {format(essenceUpgradeCost(state, upgrade.id))}
          </button>
        </div>
      ))}
    </div>
  );
}

function Instincts() {
  const { state } = game;
  return (
    <div className="subpanel">
      <Tooltip id="instincts">
        <h3 className="panel__subtitle">Greed's Instincts</h3>
      </Tooltip>
      {AUTOBUYERS.map((def) => {
        const owned = state.autobuyers[def.id]?.unlocked;
        return (
          <div className="row" key={def.id}>
            <span className="muted">{def.name}</span>
            {owned ? (
              <button
                className="btn"
                onClick={() => setAutobuyerEnabled(state, def.id, !isAutobuyerActive(state, def.id))}
              >
                {isAutobuyerActive(state, def.id) ? "On" : "Off"}
              </button>
            ) : (
              <button
                className="btn"
                disabled={!canUnlockAutobuyer(state, def.id)}
                onClick={() => unlockAutobuyer(state, def.id)}
              >
                {format(def.unlockCost)}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
