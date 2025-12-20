import type { SandboxVariant } from "../lib/runtimeConfig";

export function Hero(props: {
  variant: SandboxVariant;
  trackerSrc: string;
  serviceWorkerPath: string;
  switchLabel: string;
  onSwitchPage: () => void;
  path: string;
}) {
  const { variant, trackerSrc, serviceWorkerPath, switchLabel, onSwitchPage, path } = props;

  return (
    <header className="hero">
      <div className="hero__title-row">
        <h1>Integration sandbox</h1>
        <div className="hero__tools">
          <button type="button" className="btn-ghost" onClick={onSwitchPage}>
            {switchLabel}
          </button>
          <span className="badge">
            tracker: {variant} · <code>{path}</code>
          </span>
        </div>
      </div>

      <p className="muted">
        Тестовая страница для проверки загрузки трекера, работы Service Worker и сценариев web push. Ниже — быстрые действия
        и встроенная консоль для логов и команд.
      </p>

      <div className="meta">
        <div className="meta__item">
          <span className="meta__k">Tracker</span>
          <span className="meta__v">
            {variant} <code>{trackerSrc}</code>
          </span>
        </div>

        <div className="meta__item">
          <span className="meta__k">Service Worker</span>
          <span className="meta__v">
            <code>{serviceWorkerPath}</code>
          </span>
        </div>
      </div>
    </header>
  );
}


