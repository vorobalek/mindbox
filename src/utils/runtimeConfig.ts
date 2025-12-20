export type SandboxVariant = "proxy" | "direct";

export interface ResolvedSandboxRuntimeConfig {
  variant: SandboxVariant;
  trackerSrc: string;
  defaultFetchUrl: string;
  serviceWorkerPath: string;
  switchToUrl: string;
  switchLabel: string;
  path: string;
}

function normalizeVariant(v: unknown): SandboxVariant | "" {
  const x = String(v ?? "").toLowerCase().trim();
  if (x === "proxy" || x === "direct") return x;
  return "";
}

export function getSandboxConfig(): SandboxConfig {
  return (window.__SANDBOX_CONFIG ?? {}) as SandboxConfig;
}

export function resolveSandboxRuntimeConfig(cfg: SandboxConfig): ResolvedSandboxRuntimeConfig {
  let variant = normalizeVariant(cfg.variant);
  let trackerSrc = String(cfg.trackerSrc ?? "");

  if (!variant) {
    variant = trackerSrc.indexOf("/mindbox-tracker.js") === 0 ? "proxy" : "direct";
  }

  if (!trackerSrc) {
    trackerSrc = variant === "proxy" ? "/mindbox-tracker.js" : "https://api.mindbox.ru/scripts/v1/tracker.js";
  }

  const defaultFetchUrl = String(cfg.defaultFetchUrl ?? "/mindbox-tracker.js");
  const serviceWorkerPath = String(cfg.serviceWorkerPath ?? "/mindbox-services-worker.js");

  const switchToBasePath = String(cfg.switchToPath ?? (variant === "proxy" ? "/" : "/proxy/"));
  const switchToUrl = switchToBasePath + (location.search || "") + (location.hash || "");
  const switchLabel = variant === "proxy" ? "Открыть /" : "Открыть /proxy/";

  return {
    variant,
    trackerSrc,
    defaultFetchUrl,
    serviceWorkerPath,
    switchToUrl,
    switchLabel,
    path: location.pathname || "/"
  };
}


