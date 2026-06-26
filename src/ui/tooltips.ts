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
  "essence-shop": { title: "Sin Essence Shop", body: "Permanent upgrades bought with Sin Essence. They persist through every Feeding Frenzy." },
  instincts: { title: "Greed's Instincts", body: "Autobuyers unlocked with Sin Essence — train, dive, and digest on their own. Toggle each on or off." },
  "skill-library": { title: "Skill Library", body: "Skills devoured from foes. Re-devour to level them; equip up to your loadout for a damage bonus." },
  appraisal: { title: "Appraisal", body: "Spend Sin Essence to pierce deeper zones (Deep Sight) and read your prey (Predator's Eye)." },
  "appraisal-deep-sight": { title: "Deep Sight", body: "Each level unlocks more zones to descend into — stronger prey, richer absorption." },
  "appraisal-predator-eye": { title: "Predator's Eye", body: "Reveals enemy stats and drops before the kill." },
  "sin-trials": { title: "Sin Trials", body: "Face a Deadly Sin under its constraint. Clear it for a permanent, build-defining Sin Skill." },
  "sin-wrath": { title: "Wrath", body: "Hunger rises twice as fast. Reward: Wrath Ember." },
  "sin-sloth": { title: "Sloth", body: "Your damage is halved. Reward: Sloth Shroud." },
  "sin-lust": { title: "Lust", body: "Absorption is halved. Reward: Lust Charm." },
  "sin-pride": { title: "Pride", body: "Greed forms are locked. Reward: Pride Crown." },
  "sin-envy": { title: "Envy", body: "Training is forbidden. Reward: Envy Mirror." },
  "sin-greed": { title: "Greed", body: "Appraisal is sealed. Reward: Greed Edge." },
  "sin-gluttony": { title: "Gluttony", body: "Hunger races and damage falters. Reward: Glutton's Maw." },
  "mortal-sin": { title: "Mortal Sin", body: "At Devourer Rank S, awaken as a Mortal Sin: reset Phases 2–5 for Sins. Skills, the sin tree, and instincts persist." },
  sins: { title: "Sins", body: "The deepest prestige currency, earned by becoming a Mortal Sin. Spend it on the second-personality tree." },
  "sin-tree": { title: "The Other Voice", body: "A second personality wakes within Gluttony. Spend Sins on one of two mutually-exclusive paths — Restraint or Indulgence." },
  transcendence: { title: "Transcendence", body: "After enough Mortal Sins, reset EVERYTHING for Divinity. Perks, achievements, and titles persist forever." },
  divinity: { title: "Divinity", body: "The meta-currency of God's Domain. Spend it on permanent Domain Perks that empower every future run." },
  "domain-perks": { title: "Domain Perks", body: "Permanent multipliers bought with Divinity. They survive every reset — the payoff for transcending." },
  achievements: { title: "Achievements", body: "Milestones across every layer. Each unlocked deed grants a small permanent multiplier to all gains." },
  titles: { title: "Titles", body: "Cosmetic honours earned along the way, from Mad Glutton to God. Wear the one that suits you." },
  settings: { title: "Settings", body: "Number notation, autosave interval, offline progress, and a full hard reset." },
};

export function getTooltip(id: string): TooltipCopy | null {
  return TOOLTIPS[id] ?? null;
}
