import { game } from "../engine/game";
import { nextObjective } from "./nudge";

export function ObjectiveNudge() {
  const line = nextObjective(game.state);
  if (!line) return null;
  return (
    <div className="nudge" role="status">
      {line}
    </div>
  );
}
