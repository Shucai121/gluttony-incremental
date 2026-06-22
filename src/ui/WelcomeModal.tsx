export function WelcomeModal({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="modal__scrim" role="dialog" aria-modal="true" aria-label="The Skill Awakens">
      <div className="panel modal">
        <h2 className="panel__title">The Skill — [ Gluttony ]</h2>
        <p className="modal__lore">
          You are cursed with <strong>Gluttony</strong>. Your hunger devours the foe before you on its
          own — each kill feeds you <strong>Souls</strong>. Spend them to devour stats into your own,
          hunt ever deeper, and grow. Feed the skill... or be consumed by it.
        </p>
        <button className="btn" onClick={onBegin}>
          Begin the Feast
        </button>
      </div>
    </div>
  );
}
