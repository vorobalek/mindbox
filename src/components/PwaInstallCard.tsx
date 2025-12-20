import { useCallback, useMemo } from "react";
import { usePwaInstallPrompt } from "../hooks/usePwaInstall";

export function PwaInstallCard(props: { cfg: SandboxConfig }) {
  const { cfg } = props;
  const enabled = cfg.pwaInstallPrompt !== false;

  const { isIOS, isMobile, isStandalone, isProbablySecure, deferredPrompt, installed, dismissed, dismiss, setDeferredPrompt } =
    usePwaInstallPrompt();

  const show = enabled && isMobile && !isStandalone && !dismissed && !installed;

  const descriptionHtml = useMemo(() => {
    if (!show) return "";

    if (isIOS) {
      return "На iOS установка выполняется через меню <code>Поделиться</code> → <code>На экран Домой</code>.";
    }

    if (deferredPrompt) {
      return "Можно установить приложение и открывать его в отдельном окне.";
    }

    const note = isProbablySecure
      ? ""
      : '<br><br><span class="tok-dim">Для установки в Chrome нужен HTTPS (или localhost).</span>';

    return (
      "Чтобы установить: открой меню браузера → <code>Установить приложение</code> / <code>Добавить на главный экран</code>." +
      note
    );
  }, [deferredPrompt, isIOS, isProbablySecure, show]);

  const onInstall = useCallback(() => {
    if (!deferredPrompt) {
      try {
        // eslint-disable-next-line no-console
        console.warn("Install prompt is not available yet.");
      } catch {
        // ignore
      }
      return;
    }

    try {
      deferredPrompt.prompt();
      deferredPrompt.userChoice
        .then(() => {
          setDeferredPrompt(null);
        })
        .catch(() => {
          // ignore
        });
    } catch (e) {
      try {
        // eslint-disable-next-line no-console
        console.warn(e);
      } catch {
        // ignore
      }
    }
  }, [deferredPrompt, setDeferredPrompt]);

  const onDismiss = useCallback(() => {
    dismiss();
  }, [dismiss]);

  if (!show) return null;

  return (
    <section className="card" id="pwa-card">
      <h2>Установить как приложение</h2>
      <p
        className="muted"
        id="pwa-desc"
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
      <div className="actions">
        <button
          type="button"
          data-pwa="install"
          id="pwa-install"
          onClick={onInstall}
          disabled={!deferredPrompt}
          style={{ display: isIOS ? "none" : undefined }}
        >
          Установить
        </button>
        <button type="button" className="btn-ghost" data-pwa="dismiss" onClick={onDismiss}>
          Скрыть
        </button>
      </div>
    </section>
  );
}


