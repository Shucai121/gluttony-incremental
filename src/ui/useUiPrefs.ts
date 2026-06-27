import { create } from "zustand";
import { UiPrefs, loadUiPrefs, saveUiPrefs } from "./uiPrefs";

interface UiPrefsStore extends UiPrefs {
  dismissWelcome: () => void;
  markRevealSeen: (id: string) => void;
  markHintSeen: (id: string) => void;
  setStatsExpanded: (expanded: boolean) => void;
}

function persist(s: UiPrefs): void {
  saveUiPrefs({
    welcomeSeen: s.welcomeSeen,
    seenReveals: s.seenReveals,
    hintsSeen: s.hintsSeen,
    statsExpanded: s.statsExpanded,
  });
}

export const useUiPrefs = create<UiPrefsStore>((set, get) => ({
  ...loadUiPrefs(),
  dismissWelcome: () => {
    set({ welcomeSeen: true });
    persist(get());
  },
  markRevealSeen: (id) => {
    if (get().seenReveals.includes(id)) return;
    set({ seenReveals: [...get().seenReveals, id] });
    persist(get());
  },
  markHintSeen: (id) => {
    if (get().hintsSeen.includes(id)) return;
    set({ hintsSeen: [...get().hintsSeen, id] });
    persist(get());
  },
  setStatsExpanded: (expanded) => {
    set({ statsExpanded: expanded });
    persist(get());
  },
}));
