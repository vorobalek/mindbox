import { useEffect, useMemo } from "react";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { PwaInstallCard } from "./components/PwaInstallCard";
import { QuickActions } from "./components/QuickActions";
import { EmbeddedConsole } from "./components/EmbeddedConsole/EmbeddedConsole";
import { useEmbeddedConsole } from "./embeddedConsole/useEmbeddedConsole";
import { getSandboxConfig, resolveSandboxRuntimeConfig } from "./lib/runtimeConfig";

export function App() {
  const cfg = useMemo(() => getSandboxConfig(), []);
  const rt = useMemo(() => resolveSandboxRuntimeConfig(cfg), [cfg]);

  // Keep the same default behavior: attempt SW registration on load (unless disabled by config).
  useEffect(() => {
    if (cfg && cfg.pwa === false) return;
    if (!("serviceWorker" in navigator)) return;

    try {
      navigator.serviceWorker.register(rt.serviceWorkerPath).catch((err) => {
        try {
          // eslint-disable-next-line no-console
          console.warn(err);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }, [cfg, rt.serviceWorkerPath]);

  const consoleModel = useEmbeddedConsole({
    defaultFetchUrl: rt.defaultFetchUrl,
    serviceWorkerPath: rt.serviceWorkerPath,
    storageKey: `__embeddedConsoleHistory:${location.pathname}`
  });

  const onSwitchPage = () => {
    try {
      location.assign(rt.switchToUrl);
    } catch {
      location.href = rt.switchToUrl;
    }
  };

  return (
    <>
      <Hero
        variant={rt.variant}
        trackerSrc={rt.trackerSrc}
        serviceWorkerPath={rt.serviceWorkerPath}
        switchLabel={rt.switchLabel}
        onSwitchPage={onSwitchPage}
        path={rt.path}
      />

      <PwaInstallCard cfg={cfg} />

      <QuickActions
        defaultFetchUrl={rt.defaultFetchUrl}
        onEmitLog={() => console.log("hello from button", { ok: true, ts: Date.now(), path: location.pathname })}
        onEmitWarn={() => console.warn("warning example", { hint: "this is a sandbox", at: new Date().toISOString() })}
        onEmitError={() => console.error(new Error("example error (button)"))}
        onMindboxQueue={() => consoleModel.actions.printMindboxQueue()}
        onFetchTracker={() => void consoleModel.actions.fetchUrl(rt.defaultFetchUrl)}
        onSwRegister={() => consoleModel.actions.swRegister()}
      />

      <EmbeddedConsole model={consoleModel} cfg={cfg} />

      <Footer variant={rt.variant} path={rt.path} />
    </>
  );
}


