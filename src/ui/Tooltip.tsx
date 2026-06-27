import type { ReactNode } from "react";
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
  const copy = title !== undefined ? { title, body: body ?? "" } : id ? getTooltip(id) : null;
  if (!copy) return <>{children}</>;
  return (
    <span className="tip" tabIndex={0}>
      {children}
      <span className="tip__pop" role="tooltip">
        <p className="tip__title">{copy.title}</p>
        <p className="tip__body">{copy.body}</p>
      </span>
    </span>
  );
}
