export function QuickActions(props: {
  defaultFetchUrl: string;
  onEmitLog: () => void;
  onEmitWarn: () => void;
  onEmitError: () => void;
  onMindboxQueue: () => void;
  onFetchTracker: () => void;
  onSwRegister: () => void;
}) {
  const { defaultFetchUrl, onEmitLog, onEmitWarn, onEmitError, onMindboxQueue, onFetchTracker, onSwRegister } =
    props;

  return (
    <section className="card">
      <h2>Быстрые действия</h2>
      <div className="actions">
        <button type="button" onClick={onEmitLog}>
          console.log()
        </button>
        <button type="button" onClick={onEmitWarn}>
          console.warn()
        </button>
        <button type="button" onClick={onEmitError}>
          console.error()
        </button>
        <button type="button" onClick={onMindboxQueue}>
          print mindbox.queue
        </button>
        <button type="button" onClick={onFetchTracker}>
          fetch {defaultFetchUrl}
        </button>
        <button type="button" onClick={onSwRegister}>
          sw.register
        </button>
      </div>
      <p className="muted small">
        Подсказка: в консоли попробуй <code>help</code>, <code>clear</code>, <code>history</code> или любое JS-выражение (например:{" "}
        <code>location.pathname</code>).
      </p>
    </section>
  );
}


