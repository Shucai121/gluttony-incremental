export function ToastHost({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="toast-host">
      {messages.map((m, i) => (
        <div className="toast" role="status" key={`${i}-${m}`}>
          {m}
        </div>
      ))}
    </div>
  );
}
