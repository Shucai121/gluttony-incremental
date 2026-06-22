export interface TooltipCopy {
  title: string;
  body: string;
}

export const TOOLTIPS: Record<string, TooltipCopy> = {
  souls: { title: "Souls", body: "Harvested from the devoured. Spend them to train stats." },
  dps: { title: "Damage per Second", body: "How fast you're killing. Drives soul income." },
  hunger: { title: "Hunger", body: "Gluttony's curse — it never stops. Keep killing to hold it back." },
  "stat-STR": { title: "STR — Strength", body: "Physical attack power. Raises damage against the devoured." },
  "stat-VIT": { title: "VIT — Vitality", body: "Endurance. Gates how deep into zones you can safely hunt." },
  "stat-AGI": { title: "AGI — Agility", body: "Attack speed. Works with Frenzy to strike faster." },
  "stat-DEX": { title: "DEX — Dexterity", body: "Critical strength. Increases critical-hit multiplier." },
  "stat-MAG": { title: "MAG — Magic", body: "Magical attack power. Adds to total damage." },
  "stat-MND": { title: "MND — Mind", body: "Slows Hunger's drain and quickens absorption of stolen stats." },
  frenzy: { title: "Frenzy", body: "Feeds on attack speed — bloodlust lets you strike again." },
  zone: { title: "Zone", body: "How deep you hunt. Deeper zones yield richer souls but deadlier prey." },
  "advance-zone": { title: "Advance Zone", body: "Descend to deadlier prey once you've culled enough of the current foe." },
  digest: { title: "Digest", body: "Consume progress to raise Gluttony — a permanent feeding multiplier." },
  awaken: { title: "Awaken", body: "A deeper reset that awakens your skill further, compounding all you devour." },
};

export function getTooltip(id: string): TooltipCopy | null {
  return TOOLTIPS[id] ?? null;
}
