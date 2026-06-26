import { useEffect, useRef, useState } from "react";
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
import { GreedPanel } from "./GreedPanel";
import { FrenzyPanel } from "./FrenzyPanel";
import { SkillLibraryPanel } from "./SkillLibraryPanel";
import { AppraisalPanel } from "./AppraisalPanel";
import { SinTrialPanel } from "./SinTrialPanel";
import { MortalSinPanel } from "./MortalSinPanel";
import { SinTreePanel } from "./SinTreePanel";
import { TranscendencePanel } from "./TranscendencePanel";
import { DomainPerkPanel } from "./DomainPerkPanel";
import { AchievementsPanel } from "./AchievementsPanel";
import { TitlesPanel } from "./TitlesPanel";
import { WelcomeModal } from "./WelcomeModal";
import { ObjectiveNudge } from "./ObjectiveNudge";
import { ToastHost } from "./SkillToast";

const PANEL_COMPONENTS: Record<Panel, () => JSX.Element> = {
  foe: FoePanel,
  status: StatusPanel,
  training: TrainingPanel,
  zone: ZonePanel,
  gluttony: GluttonyPanel,
  greed: GreedPanel,
  frenzy: FrenzyPanel,
  skills: SkillLibraryPanel,
  appraisal: AppraisalPanel,
  trials: SinTrialPanel,
  mortalsin: MortalSinPanel,
  sintree: SinTreePanel,
  transcendence: TranscendencePanel,
  perks: DomainPerkPanel,
  achievements: AchievementsPanel,
  titles: TitlesPanel,
};

export function AppShell() {
  useRender((s) => s.frame); // re-render each tick to sample live game state
  const prefs = useUiPrefs();
  const state = game.state;
  const [toasts, setToasts] = useState<string[]>([]);
  const toastedRef = useRef<Set<string>>(new Set());

  // The first time a panel clears its reveal threshold, fire a one-time toast
  // that lingers on its own timer, independent of the persisted seen-set
  // (which updates instantly and would otherwise unmount the toast next frame).
  const pendingReveals = PANELS.filter(
    (p) => REVEAL_COPY[p] !== "" && isRevealed(p, state) && !prefs.seenReveals.includes(p),
  );
  useEffect(() => {
    const fresh = pendingReveals.filter((p) => !toastedRef.current.has(p));
    if (fresh.length === 0) return;
    for (const p of fresh) {
      toastedRef.current.add(p);
      prefs.markRevealSeen(p);
    }
    const messages = fresh.map((p) => REVEAL_COPY[p]);
    setToasts((cur) => [...cur, ...messages]);
    const timer = setTimeout(() => setToasts((cur) => cur.slice(messages.length)), 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReveals.join(",")]);

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
        const Comp = PANEL_COMPONENTS[p];
        return (
          <div className="reveal" key={p}>
            <Comp />
          </div>
        );
      })}

      <ToastHost messages={toasts} />
    </div>
  );
}
