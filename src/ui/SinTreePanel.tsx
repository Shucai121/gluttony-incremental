import { game } from "../engine/game";
import { format } from "../engine/format";
import { SIN_TREE } from "../content/sinTree";
import { buyNode, canBuyNode, committedBranch, ownsNode } from "../engine/sinTree";
import { Tooltip } from "./Tooltip";

export function SinTreePanel() {
  const { state } = game;
  const branch = committedBranch(state);
  return (
    <section className="panel">
      <Tooltip id="sin-tree">
        <h2 className="panel__title">[ The Other Voice ]</h2>
      </Tooltip>
      <div className="row">
        <span className="muted">Path</span>
        <span>{branch ? branch[0].toUpperCase() + branch.slice(1) : "Unchosen"}</span>
      </div>
      {SIN_TREE.map((node) => (
        <div className="row" key={node.id}>
          <Tooltip id={`sintree-${node.id}`}>
            <span className="muted">
              {node.name} (×{format(node.mult)})
            </span>
          </Tooltip>
          {ownsNode(state, node.id) ? (
            <span>Owned</span>
          ) : (
            <button
              className="btn"
              disabled={!canBuyNode(state, node.id)}
              onClick={() => buyNode(state, node.id)}
            >
              {format(node.cost)}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
