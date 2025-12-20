import { escapeHtml } from "./escapeHtml";
import { formatValueHtml } from "./format";

export type AppendLine = (level: string, bodyHtml: string, t?: number) => void;

export interface SandboxActions {
  fetchUrl: (url?: string) => Promise<void>;
  swRegister: () => void;
  swUnregister: () => Promise<void>;
  printMindboxQueue: () => void;
}

export function createSandboxActions(opts: {
  defaultFetchUrl: string;
  serviceWorkerPath: string;
  appendLine: AppendLine;
}): SandboxActions {
  const { defaultFetchUrl, serviceWorkerPath, appendLine } = opts;

  async function fetchUrl(url?: string) {
    const target = (url || defaultFetchUrl).trim();
    appendLine("info", `fetch <span class="tok-string">${escapeHtml(target)}</span> …`, Date.now());

    try {
      const res = await fetch(target, { cache: "no-store" });
      const text = await res.text();

      appendLine("info", `status ${res.status} ${escapeHtml(res.statusText || "")}`, Date.now());

      const body = text.length > 2500 ? `${text.slice(0, 2500)}\n…(truncated)` : text;
      appendLine("log", `<pre class="pre">${escapeHtml(body)}</pre>`, Date.now());
    } catch (err) {
      appendLine("error", formatValueHtml(err), Date.now());
    }
  }

  function swRegister() {
    if (!("serviceWorker" in navigator)) {
      appendLine("warn", '<span class="tok-dim">Service Worker API недоступен в этом браузере</span>', Date.now());
      return;
    }

    appendLine("info", `register <span class="tok-string">${escapeHtml(serviceWorkerPath)}</span> …`, Date.now());

    navigator.serviceWorker
      .register(serviceWorkerPath)
      .then((reg) => {
        appendLine("info", `registered scope: <span class="tok-string">${escapeHtml(reg.scope)}</span>`, Date.now());
      })
      .catch((err) => {
        appendLine("error", formatValueHtml(err), Date.now());
      });
  }

  async function swUnregister() {
    if (!("serviceWorker" in navigator)) {
      appendLine("warn", '<span class="tok-dim">Service Worker API недоступен</span>', Date.now());
      return;
    }

    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (!regs.length) {
        appendLine("info", '<span class="tok-dim">No registrations</span>', Date.now());
        return;
      }

      const results = await Promise.all(regs.map((r) => r.unregister()));
      appendLine("info", `unregister: ${escapeHtml(JSON.stringify(results))}`, Date.now());
    } catch (err) {
      appendLine("error", formatValueHtml(err), Date.now());
    }
  }

  function printMindboxQueue() {
    const q = window.mindbox && window.mindbox.queue ? window.mindbox.queue : null;
    appendLine("info", `mindbox.queue = ${formatValueHtml(q)}`, Date.now());
  }

  return {
    fetchUrl,
    swRegister,
    swUnregister,
    printMindboxQueue
  };
}


