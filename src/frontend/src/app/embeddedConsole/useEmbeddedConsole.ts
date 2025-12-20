import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { escapeHtml } from "../lib/escapeHtml";
import { evalJs } from "./evalJs";
import { formatValueHtml } from "./format";
import { createSandboxActions, type SandboxActions } from "./sandboxActions";
import { useCommandHistory } from "./useCommandHistory";

export interface ConsoleLine {
  id: number;
  t: number;
  level: string;
  bodyHtml: string;
}

export interface EmbeddedConsoleModel {
  lines: ConsoleLine[];
  clear: () => void;
  help: () => void;
  runCommand: (raw: string) => void;
  copyText: (text: string) => void;

  historySize: number;
  historyPrev: () => string;
  historyNext: () => string;
  historyResetCursor: () => void;

  actions: SandboxActions;
}

export function useEmbeddedConsole(opts: {
  defaultFetchUrl: string;
  serviceWorkerPath: string;
  storageKey: string;
}): EmbeddedConsoleModel {
  const { defaultFetchUrl, serviceWorkerPath, storageKey } = opts;

  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const idRef = useRef(0);

  const appendLine = useCallback((level: string, bodyHtml: string, t = Date.now()) => {
    setLines((prev) => {
      const next: ConsoleLine[] = [...prev, { id: ++idRef.current, t, level, bodyHtml }];
      return next.length > 800 ? next.slice(-800) : next;
    });
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const printCapturedEntry = useCallback(
    (entry: CapturedConsoleEntry) => {
      if (!entry) return;
      if (entry.level === "clear") {
        clear();
        return;
      }

      const args = entry.args || [];
      if (!args.length) {
        appendLine(entry.level || "log", '<span class="tok-dim">(no output)</span>', entry.t);
        return;
      }

      const parts = args.map(formatValueHtml);
      appendLine(entry.level || "log", parts.join(' <span class="tok-dim"> </span>'), entry.t);
    },
    [appendLine, clear]
  );

  const actions = useMemo(() => {
    return createSandboxActions({ defaultFetchUrl, serviceWorkerPath, appendLine });
  }, [defaultFetchUrl, serviceWorkerPath, appendLine]);

  const { history, push, prev: historyPrev, next: historyNext, resetCursor: historyResetCursor } = useCommandHistory(storageKey);

  const help = useCallback(() => {
    const html = [
      '<span class="tok-key">Commands</span>:',
      '<br><span class="tok-string">help</span> — список команд',
      '<br><span class="tok-string">clear</span> — очистить вывод (или Ctrl+L)',
      '<br><span class="tok-string">history</span> — показать историю команд',
      '<br><span class="tok-string">echo &lt;text&gt;</span> — вывести текст',
      '<br><span class="tok-string">date</span> — текущая дата/время',
      `<br><span class="tok-string">fetch [url]</span> — запрос (по умолчанию ${escapeHtml(defaultFetchUrl)})`,
      '<br><span class="tok-string">sw.register</span> — зарегистрировать Service Worker',
      '<br><span class="tok-string">sw.unregister</span> — удалить Service Worker',
      '<br><span class="tok-string">mindbox.queue</span> — показать mindbox.queue',
      '<br><span class="tok-dim">Любая другая строка</span> — выполнится как JS в контексте страницы'
    ].join("");
    appendLine("info", html, Date.now());
  }, [appendLine, defaultFetchUrl]);

  const runHistoryCommand = useCallback(() => {
    if (!history.length) {
      appendLine("info", '<span class="tok-dim">History is empty</span>', Date.now());
      return;
    }
    const start = Math.max(0, history.length - 50);
    const list = history
      .slice(-50)
      .map((x, idx) => `${start + idx + 1}. ${x}`)
      .join("\n");
    appendLine("info", `<pre class="pre">${escapeHtml(list)}</pre>`, Date.now());
  }, [appendLine, history]);

  const runCommand = useCallback(
    (raw: string) => {
      const code = String(raw || "").trim();
      if (!code) return;

      appendLine("cmd", `<span class="tok-dim">&gt;</span> ${escapeHtml(code)}`, Date.now());

      push(code);

      const parts = code.split(/\s+/);
      const cmd = parts[0];
      const rest = code.slice(cmd.length).trim();

      if (cmd === "help") return help();
      if (cmd === "clear") return clear();
      if (cmd === "history") return runHistoryCommand();
      if (cmd === "echo") return appendLine("log", escapeHtml(rest), Date.now());
      if (cmd === "date")
        return appendLine("log", `<span class="tok-string">${escapeHtml(new Date().toString())}</span>`, Date.now());
      if (cmd === "fetch") return void actions.fetchUrl(rest);
      if (cmd === "sw.register") return actions.swRegister();
      if (cmd === "sw.unregister") return void actions.swUnregister();
      if (cmd === "mindbox.queue") return actions.printMindboxQueue();

      Promise.resolve()
        .then(() => evalJs(code))
        .then((result) => {
          if (result !== undefined) appendLine("result", formatValueHtml(result), Date.now());
        })
        .catch((err) => {
          appendLine("error", formatValueHtml(err), Date.now());
        });
    },
    [actions, appendLine, clear, help, push, runHistoryCommand]
  );

  const copyText = useCallback(
    (text: string) => {
      const value = String(text || "");

      function done(ok: boolean) {
        appendLine(ok ? "info" : "warn", ok ? "copied" : "copy failed", Date.now());
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(value)
          .then(() => done(true))
          .catch(() => done(false));
        return;
      }

      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        done(ok);
      } catch {
        done(false);
      }
    },
    [appendLine]
  );

  useEffect(() => {
    const sink = (entry: CapturedConsoleEntry) => {
      try {
        printCapturedEntry(entry);
      } catch {
        // ignore
      }
    };

    window.__embeddedConsoleSink = sink;

    // Initial message + flush buffered output captured by bootstrap.
    appendLine("info", 'Embedded console ready. Type <span class="tok-string">help</span> or run JS.', Date.now());
    const buf = window.__embeddedConsole?.buffer ? window.__embeddedConsole.buffer.slice() : [];
    if (window.__embeddedConsole?.buffer) window.__embeddedConsole.buffer.length = 0;
    buf.forEach(printCapturedEntry);

    return () => {
      if (window.__embeddedConsoleSink === sink) window.__embeddedConsoleSink = undefined;
    };
  }, [appendLine, printCapturedEntry]);

  return {
    lines,
    clear,
    help,
    runCommand,
    copyText,
    historySize: history.length,
    historyPrev,
    historyNext,
    historyResetCursor,
    actions
  };
}


