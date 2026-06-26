// A tiny synchronous event bus. The engine emits discrete milestone events; the UI
// notification queue subscribes. Emitting is a no-op when nobody is listening, so the
// engine stays pure-testable (tests subscribe explicitly).

export type PrestigeLayer = "digest" | "awaken" | "frenzy" | "mortal-sin" | "transcend";

export type GameEvent =
  | { type: "rank-up"; rank: string }
  | { type: "skill-gained"; name: string }
  | { type: "achievement"; name: string }
  | { type: "title"; name: string }
  | { type: "sin-skill"; name: string }
  | { type: "prestige"; layer: PrestigeLayer; gain?: string };

type Listener = (event: GameEvent) => void;

const listeners = new Set<Listener>();

export function emit(event: GameEvent): void {
  for (const fn of listeners) fn(event);
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Test helper — clear all subscribers. */
export function _resetListeners(): void {
  listeners.clear();
}

const PRESTIGE_VERB: Record<PrestigeLayer, string> = {
  digest: "Digested",
  awaken: "Awakened Gluttony",
  frenzy: "Feeding Frenzy",
  "mortal-sin": "Mortal Sin Awakening",
  transcend: "Transcended",
};

/** Pure `[Appraisal]`-style copy for a notification card. */
export function describeEvent(event: GameEvent): { tag: string; text: string } {
  switch (event.type) {
    case "rank-up":
      return { tag: "Rank Up", text: `Devourer Rank rose to ${event.rank}.` };
    case "skill-gained":
      return { tag: "Skill Acquired", text: `Skill '${event.name}' tore free of the devoured.` };
    case "achievement":
      return { tag: "Achievement", text: `${event.name} — a permanent power settles into you.` };
    case "title":
      return { tag: "Title", text: `The world now names you ${event.name}.` };
    case "sin-skill":
      return { tag: "Sin Skill", text: `Trial cleared. You claim ${event.name}.` };
    case "prestige": {
      const verb = PRESTIGE_VERB[event.layer];
      return {
        tag: "Prestige",
        text: event.gain ? `${verb}. +${event.gain}.` : `${verb}.`,
      };
    }
  }
}
