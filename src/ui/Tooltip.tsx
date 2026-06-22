import type { ReactNode } from "react";
import { getTooltip } from "./tooltips";

export function Tooltip({ id, children }: { id: string; children: ReactNode }) {
  const copy = getTooltip(id);
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
