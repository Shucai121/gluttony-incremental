export interface Notification {
  id: number;
  tag: string;
  text: string;
}

/** Append an item, dropping the oldest entries so the list never exceeds `cap`. */
export function pushCapped(list: Notification[], item: Notification, cap: number): Notification[] {
  const next = [...list, item];
  return next.length > cap ? next.slice(next.length - cap) : next;
}
