import { useCallback, useEffect, useMemo, useState } from "react";

function mm(q: string): boolean {
  try {
    return Boolean(window.matchMedia && window.matchMedia(q).matches);
  } catch {
    return false;
  }
}

function computeIsIOS(): boolean {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (ua.indexOf("Mac") >= 0 && "ontouchend" in document);
}

export interface PwaInstallPromptState {
  isIOS: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  isProbablySecure: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  dismissed: boolean;
  dismiss: () => void;
  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void;
}

export function usePwaInstallPrompt(dismissKey = "__pwaInstallDismissed:v1"): PwaInstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => window.__pwaInstall?.deferredPrompt ?? null
  );
  const [installed, setInstalled] = useState<boolean>(() => window.__pwaInstall?.installed ?? false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });

  const isIOS = useMemo(() => computeIsIOS(), []);
  const isTouch = useMemo(() => (navigator.maxTouchPoints || 0) > 0, []);
  const isMobile = useMemo(() => isIOS || isTouch || mm("(pointer: coarse)") || mm("(hover: none)"), [isIOS, isTouch]);
  const isStandalone = useMemo(
    () => mm("(display-mode: standalone)") || (window.navigator as unknown as { standalone?: boolean }).standalone === true,
    []
  );
  const isProbablySecure = useMemo(() => {
    return (
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    );
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }, [dismissKey]);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      const ev = e as BeforeInstallPromptEvent;
      try {
        ev.preventDefault();
      } catch {
        // ignore
      }
      try {
        if (window.__pwaInstall) window.__pwaInstall.deferredPrompt = ev;
      } catch {
        // ignore
      }
      setDeferredPrompt(ev);
    }

    function onAppInstalled() {
      try {
        if (window.__pwaInstall) {
          window.__pwaInstall.installed = true;
          window.__pwaInstall.deferredPrompt = null;
        }
      } catch {
        // ignore
      }
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  return {
    isIOS,
    isMobile,
    isStandalone,
    isProbablySecure,
    deferredPrompt,
    installed,
    dismissed,
    dismiss,
    setDeferredPrompt
  };
}


