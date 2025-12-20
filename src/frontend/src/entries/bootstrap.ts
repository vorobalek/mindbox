/* Shared early bootstrap for Mindbox sandbox pages:
   - captures console output before UI is mounted
   - forwards window errors into console (so they show up in the embedded console)
   - captures `beforeinstallprompt` early for PWA install UX */

(function () {
  if (window.__mindboxSandboxBootstrap) return;
  window.__mindboxSandboxBootstrap = true;

  // Embedded console bootstrap: captures console output before UI is mounted
  (function () {
    if (window.__embeddedConsole) return;

    if (!window.console) (window as unknown as { console: Record<string, unknown> }).console = {};

    const buffer: CapturedConsoleEntry[] = [];
    const original: Record<string, (...args: unknown[]) => void> = {};
    const levels = ["log", "info", "warn", "error", "debug"] as const;

    function push(level: string, argsLike: ArrayLike<unknown> | unknown[] | undefined) {
      const entry: CapturedConsoleEntry = {
        t: Date.now(),
        level,
        args: Array.prototype.slice.call(argsLike || [])
      };

      buffer.push(entry);

      if (typeof window.__embeddedConsoleSink === "function") {
        try {
          window.__embeddedConsoleSink(entry);
        } catch {
          // ignore
        }
      }
    }

    levels.forEach((level) => {
      const fn = typeof console[level] === "function" ? console[level].bind(console) : () => {};
      original[level] = fn;
      console[level] = (...args: unknown[]) => {
        push(level, args);
        try {
          fn.apply(console, args);
        } catch {
          // ignore
        }
      };
    });

    const clearFn = typeof console.clear === "function" ? console.clear.bind(console) : () => {};
    original.clear = clearFn;
    console.clear = () => {
      push("clear", []);
      try {
        clearFn();
      } catch {
        // ignore
      }
    };

    window.__embeddedConsole = {
      buffer,
      original,
      levels: levels.slice() as unknown as string[]
    };
  })();

  // Forward global errors into console
  (function () {
    if (window.__mindboxSandboxErrorHooks) return;
    window.__mindboxSandboxErrorHooks = true;

    window.addEventListener("error", (ev) => {
      try {
        const e = ev as ErrorEvent;
        // eslint-disable-next-line no-console
        console.error(e.error || (e.message ? new Error(e.message) : "Window error"));
      } catch {
        // ignore
      }
    });

    window.addEventListener("unhandledrejection", (ev) => {
      try {
        const e = ev as PromiseRejectionEvent;
        // eslint-disable-next-line no-console
        console.error(e.reason || "Unhandled rejection");
      } catch {
        // ignore
      }
    });
  })();

  // Capture PWA install prompt as early as possible (some browsers may fire it before UI scripts load)
  (function () {
    if (window.__pwaInstallPromptCapture) return;
    window.__pwaInstallPromptCapture = true;

    window.__pwaInstall = window.__pwaInstall || { deferredPrompt: null, installed: false };

    window.addEventListener("beforeinstallprompt", (e) => {
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
    });

    window.addEventListener("appinstalled", () => {
      try {
        if (window.__pwaInstall) window.__pwaInstall.installed = true;
      } catch {
        // ignore
      }
      try {
        if (window.__pwaInstall) window.__pwaInstall.deferredPrompt = null;
      } catch {
        // ignore
      }
    });
  })();
})();


