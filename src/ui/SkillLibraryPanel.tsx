import { game } from "../engine/game";
import { LOADOUT_SIZE, skillById } from "../content/skills";
import { equipSkill, equippedCount, isEquipped, skillLevel, unequipSkill } from "../engine/skills";
import { Tooltip } from "./Tooltip";

export function SkillLibraryPanel() {
  const { state } = game;
  const owned = Object.keys(state.skills);
  return (
    <section className="panel">
      <Tooltip id="skill-library">
        <h2 className="panel__title">[ Skill Library ]</h2>
      </Tooltip>
      <div className="row">
        <span className="muted">Loadout</span>
        <span>
          {equippedCount(state)} / {LOADOUT_SIZE}
        </span>
      </div>
      {owned.length === 0 ? (
        <div className="row">
          <span className="muted">No skills devoured yet.</span>
        </div>
      ) : (
        owned.map((id) => {
          const def = skillById(id);
          if (!def) return null;
          const equipped = isEquipped(state, id);
          return (
            <div className="row" key={id}>
              <Tooltip title={`${def.name} · Lv ${skillLevel(state, id)}`} body={def.description}>
                <span className="muted">
                  {def.name} · Lv {skillLevel(state, id)}
                </span>
              </Tooltip>
              <button
                className="btn"
                disabled={!equipped && equippedCount(state) >= LOADOUT_SIZE}
                onClick={() => (equipped ? unequipSkill(state, id) : equipSkill(state, id))}
              >
                {equipped ? "Unequip" : "Equip"}
              </button>
            </div>
          );
        })
      )}
    </section>
  );
}
