export interface TooltipCopy {
  title: string;
  body: string;
}

export const TOOLTIPS: Record<string, TooltipCopy> = {
  souls: { title: "Souls", body: "Harvested from the devoured. Spend them to train your stats." },
  dps: { title: "Damage / sec", body: "How fast your hunger tears through the foe. Rises with your stats." },
  hunger: { title: "Hunger", body: "Rises as you devour. Left unfed it gnaws at you — Mind slows its drain." },
  gluttony: { title: "Gluttony", body: "Your cursed skill's tier. Each Digest deepens its multiplier." },
  kills: { title: "Kills", body: "Foes devoured. The more you cull, the stronger the prey becomes." },
  "hard-reset": { title: "Hard Reset", body: "Wipes ALL progress and begins the feast anew. There is no undo." },
  "stat-STR": { title: "STR — Strength", body: "Physical attack power. Raises damage against the devoured." },
  "stat-VIT": { title: "VIT — Vitality", body: "Endurance. Gates how deep into the zones you can safely hunt." },
  "stat-AGI": { title: "AGI — Agility", body: "Attack speed. Works with Frenzy to strike faster." },
  "stat-DEX": { title: "DEX — Dexterity", body: "Critical strength. Increases your critical-hit multiplier." },
  "stat-MAG": { title: "MAG — Magic", body: "Magical attack power. Adds to your total damage." },
  "stat-MND": { title: "MND — Mind", body: "Slows Hunger's drain and quickens absorption of stolen stats." },
  frenzy: { title: "Frenzy", body: "Feeds your attack speed — the bloodlust that lets you strike again." },
  zone: { title: "Zone", body: "How deep you hunt. Deeper zones yield richer souls but deadlier prey." },
  "advance-zone": { title: "Advance Zone", body: "Descend to deadlier prey once you've culled enough of the current foe." },
  digest: { title: "Digest", body: "Consume your progress to raise Gluttony — a permanent feeding multiplier." },
  awaken: { title: "Awaken", body: "A deeper reset that awakens the skill further, compounding all you devour." },
  "greed-form": { title: "Greed", body: "The sentient black sword. Each form it takes multiplies your damage." },
  "advance-form": { title: "Advance Form", body: "Pay Souls and stats to reshape Greed into a deadlier form." },
  "blood-burst": { title: "Blood Burst", body: "Spend Vitality to gorge Greed on blood — a burst of bonus damage for a short time." },
  "feeding-frenzy": { title: "Feeding Frenzy", body: "At maximum Hunger, Gluttony devours everything — your run resets for Sin Essence." },
  "sin-essence": { title: "Sin Essence", body: "The residue of a devoured run. Spend it to raise your Rank, buy upgrades, and unlock instincts." },
  "devourer-rank": { title: "Devourer Rank", body: "Rises with total Sin Essence (E→S). Each rank multiplies all damage and souls." },
};

export function getTooltip(id: string): TooltipCopy | null {
  return TOOLTIPS[id] ?? null;
}
