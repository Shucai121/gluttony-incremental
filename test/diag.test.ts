import { describe, it } from "vitest";
import { defaultState } from "../src/state/store";
import { AUTOBUYERS } from "../src/content/autobuyers";
import { stepEngine } from "../src/engine/step";
import { computeDps } from "../src/engine/combat";
import { format } from "../src/engine/format";
// Manual balance-sim probe (50k ticks, ~5min). Skipped by default; run with RUN_DIAG=1 (npm run test:diag).
// Read process via globalThis so this typechecks without @types/node (vite app has none).
const RUN_DIAG = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  ?.RUN_DIAG;
describe.skipIf(RUN_DIAG !== "1")("diag", () => {
  it("logs", () => {
    const s = defaultState();
    for (const d of AUTOBUYERS) s.autobuyers[d.id] = { unlocked: true, enabled: true, priority: d.defaultPriority };
    console.log("dps0", format(computeDps(s)), "hp", format(s.current.hp));
    for (let i = 0; i < 50000; i++) {
      stepEngine(s, 0.05);
      if (i === 2000 || i === 10000 || i === 49999) {
        console.log(`tick ${i}: kills=${format(s.totalKills)} souls=${format(s.souls)} STR=${format(s.stats.STR.value)} glut=${format(s.gluttonyLevel)} hunger=${s.hunger.toFixed(1)} zone=${s.zone} dps=${format(computeDps(s))}`);
      }
    }
  });
});
