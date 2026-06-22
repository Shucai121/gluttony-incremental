import { useEffect } from "react";
import { useRender } from "../state/store";
import { game } from "../engine/game";
import { format } from "../engine/format";
import { isRevealed, PANELS, REVEAL_COPY, Panel } from "./reveal";
import { useUiPrefs } from "./useUiPrefs";
import { Tooltip } from "./Tooltip";
import { HungerBar } from "./HungerBar";
import { FoePanel } from "./FoePanel";
import { StatusPanel } from "./StatusPanel";
import { TrainingPanel } from "./TrainingPanel";
import { ZonePanel } from "./ZonePanel";
import { GluttonyPanel } from "./GluttonyPanel";
import { WelcomeModal } from "./WelcomeModal";
import { ObjectiveNudge } from "./ObjectiveNudge";
import { ToastHost } from "./SkillToast";

const PANEL_COMPONENTS: Record<Panel, () => JSX.Element> = {
  foe: FoePanel,
  status: StatusPanel,
  training: TrainingPanel,
  zone: ZonePanel,
  gluttony: GluttonyPanel,
};

export function AppShell() {
  useRender((s) => s.frame); // re-render each tick to sample live game state
  const prefs = useUiPrefs();
  const state = game.state;

  // Fire a one-time toast the first time a panel clears its reveal threshold.
  const newlyRevealed = PANELS.filter(
    (p) => REVEAL_COPY[p] !== "" && isRevealed(p, state) && !prefs.seenReveals.includes(p),
  );
  useEffect(() => {
    for (const p of newlyRevealed) prefs.markRevealSeen(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyRevealed.join(",")]);

  return (
    <div className="app-shell">
      {!prefs.welcomeSeen && <WelcomeModal onBegin={prefs.dismissWelcome} />}

      <header className="resourcebar panel">
        <Tooltip id="souls">
          <span className="resource">
            <span className="muted">Souls</span>
            <span>{format(state.souls)}</span>
          </span>
        </Tooltip>
        <Tooltip id="hunger">
          <span className="resource">
            <span className="muted">Hunger</span>
            <span style={{ width: 96 }}>
              <HungerBar value={state.hunger} max={state.hungerMax} />
            </span>
          </span>
        </Tooltip>
        <Tooltip id="gluttony">
          <span className="resource">
            <span className="muted">Gluttony</span>
            <span>Lv {format(state.gluttonyLevel)}</span>
          </span>
        </Tooltip>
      </header>

      <ObjectiveNudge />

      {PANELS.map((p) => {
        if (!isRevealed(p, state)) return null;
        const Panel = PANEL_COMPONENTS[p];
        return (
          <div className="reveal" key={p}>
            <Panel />
          </div>
        );
      })}

      <ToastHost messages={newlyRevealed.map((p) => REVEAL_COPY[p])} />
    </div>
  );
}
