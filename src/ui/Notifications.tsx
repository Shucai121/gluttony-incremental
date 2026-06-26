import { useEffect, useRef, useState } from "react";
import { describeEvent, subscribe } from "../engine/events";
import { Notification, pushCapped } from "./notifyQueue";

const CAP = 4;
const LIFETIME_MS = 5000;

/**
 * The `[Appraisal]` status-window feed. Subscribes to the engine event bus and shows a
 * capped stack of cards, each self-expiring on its own timer (refs, never the game tick).
 */
export function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const unsub = subscribe((event) => {
      const { tag, text } = describeEvent(event);
      const id = nextId.current++;
      setItems((cur) => pushCapped(cur, { id, tag, text }, CAP));
      const timer = window.setTimeout(() => {
        setItems((cur) => cur.filter((n) => n.id !== id));
      }, LIFETIME_MS);
      timers.current.push(timer);
    });
    return () => {
      unsub();
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="appraisal-feed">
      {items.map((n) => (
        <div className="appraisal-card" role="status" key={n.id}>
          <span className="appraisal-card__tag">[ {n.tag} ]</span>
          <span className="appraisal-card__text">{n.text}</span>
        </div>
      ))}
    </div>
  );
}
