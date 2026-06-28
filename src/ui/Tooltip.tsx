import { useRef, type ReactNode } from "react";
import { getTooltip } from "./tooltips";

// Pass `id` to look up shared copy from tooltips.ts, or `title`/`body` for inline
// content (used by data-driven rows like skills that carry their own descriptions).
export function Tooltip({
  id,
  title,
  body,
  children,
}: {
  id?: string;
  title?: string;
  body?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const copy = title !== undefined ? { title, body: body ?? "" } : id ? getTooltip(id) : null;
  if (!copy) return <>{children}</>;

  // On touch there is no hover-out: a tap focuses the trigger and CSS :focus shows the
  // popup. Dismiss it by blurring on the next pointer-down outside the tip — iOS doesn't
  // reliably blur on taps of inert elements, so we do it explicitly.
  function handleFocus() {
    const el = ref.current;
    if (!el) return;
    const onOutside = (e: PointerEvent) => {
      if (!el.contains(e.target as Node)) el.blur();
    };
    document.addEventListener("pointerdown", onOutside, true);
    el.addEventListener(
      "blur",
      () => document.removeEventListener("pointerdown", onOutside, true),
      { once: true },
    );
  }

  return (
    <span className="tip" tabIndex={0} ref={ref} onFocus={handleFocus}>
      {children}
      <span className="tip__pop" role="tooltip">
        <p className="tip__title">{copy.title}</p>
        <p className="tip__body">{copy.body}</p>
      </span>
    </span>
  );
}
