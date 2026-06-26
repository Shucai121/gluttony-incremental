import { ESSENCE_UPGRADES, EssenceEffectKind, essenceUpgradeById } from "../content/essenceShop";
import { GameState } from "../state/types";
import { Decimal, ONE, ZERO, geometricCost } from "./decimal";

export function essenceUpgradeLevel(state: GameState, id: string): number {
  return state.essenceUpgrades[id] ?? 0;
}

export function essenceUpgradeCost(state: GameState, id: string): Decimal {
  const upgrade = essenceUpgradeById(id);
  if (!upgrade) return ZERO;
  return geometricCost(upgrade.baseCost, upgrade.costMult, essenceUpgradeLevel(state, id));
}

export function canBuyEssenceUpgrade(state: GameState, id: string): boolean {
  const upgrade = essenceUpgradeById(id);
  if (!upgrade) return false;
  if (upgrade.maxLevel !== null && essenceUpgradeLevel(state, id) >= upgrade.maxLevel) return false;
  return state.sinEssence.gte(essenceUpgradeCost(state, id));
}

export function buyEssenceUpgrade(state: GameState, id: string): boolean {
  if (!canBuyEssenceUpgrade(state, id)) return false;
  state.sinEssence = state.sinEssence.sub(essenceUpgradeCost(state, id));
  state.essenceUpgrades[id] = essenceUpgradeLevel(state, id) + 1;
  return true;
}

function kindMult(state: GameState, kind: EssenceEffectKind): Decimal {
  let mult = ONE;
  for (const upgrade of ESSENCE_UPGRADES) {
    if (upgrade.kind !== kind) continue;
    const level = essenceUpgradeLevel(state, upgrade.id);
    if (level > 0) mult = mult.mul(upgrade.multPerLevel.pow(level));
  }
  return mult;
}

export function essenceShopMult(state: GameState): Decimal {
  return kindMult(state, "global");
}

export function essenceAbsorptionMult(state: GameState): Decimal {
  return kindMult(state, "absorption");
}
