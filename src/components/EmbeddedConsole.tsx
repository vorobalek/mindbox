import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { EmbeddedConsoleModel } from "../hooks/useEmbeddedConsole";

function timeLabel(t: number): string {
  try {
    return new Date(t || Date.now()).toLocaleTimeString("ru-RU", { hour12: false });
  } catch {
    return "--:--:--";
  }
}

function shouldAutofocusInput(cfg: SandboxConfig): boolean {
  try {
    const isCoarsePointer = Boolean(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    const isHoverNone = Boolean(window.matchMedia && window.matchMedia("(hover: none)").matches);
    let should = !(isCoarsePointer || isHoverNone);
    if (cfg.autoFocusInput === true) should = true;
    if (cfg.autoFocusInput === false) should = false;
    return should;
  } catch {
    return true;
  }
}

export function EmbeddedConsole(props: { model: EmbeddedConsoleModel; cfg: SandboxConfig }) {
  const { model, cfg } = props;

  const outputRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const stickToBottomRef = useRef(true);

  const [input, setInput] = useState("");

  const onScroll = useCallback(() => {
    const el = outputRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 18;
  }, []);

  useEffect(() => {
    const el = outputRef.current;
    if (!el) return;
    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [model.lines.length]);

  useEffect(() => {
    if (!inputRef.current) return;
    if (shouldAutofocusInput(cfg)) inputRef.current.focus();
  }, [cfg.autoFocusInput]);

  const run = useCallback(() => {
    const code = input;
    setInput("");
    model.runCommand(code);
  }, [input, model]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        run();
        return;
      }

      const key = String(e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "l") {
        e.preventDefault();
        model.clear();
        return;
      }

      if (e.key === "ArrowUp") {
        if (model.historySize <= 0) return;
        e.preventDefault();
        setInput(model.historyPrev());
        return;
      }

      if (e.key === "ArrowDown") {
        if (model.historySize <= 0) return;
        e.preventDefault();
        setInput(model.historyNext());
        return;
      }
    },
    [model, run]
  );

  const onCopy = useCallback(() => {
    const text = outputRef.current?.innerText || "";
    model.copyText(text);
  }, [model]);

  return (
    <section className="card console-card">
      <div className="console-head">
        <h2>Встроенная консоль</h2>
        <div className="console-head__right">
          <button type="button" className="btn-ghost" onClick={model.help}>
            Help
          </button>
          <button type="button" className="btn-ghost" onClick={onCopy}>
            Copy
          </button>
          <button type="button" className="btn-ghost" onClick={model.clear}>
            Clear
          </button>
        </div>
      </div>

      <div className="console" id="embedded-console">
        <div
          className="console-output"
          id="console-output"
          aria-label="Console output"
          role="log"
          ref={outputRef}
          onScroll={onScroll}
        >
          {model.lines.map((line) => (
            <div key={line.id} className={`console-line lvl-${line.level || "log"}`}>
              <div className="console-time">{timeLabel(line.t)}</div>
              <div className="console-body" dangerouslySetInnerHTML={{ __html: line.bodyHtml }} />
            </div>
          ))}
        </div>

        <div className="console-input">
          <span className="prompt">&gt;</span>
          <input
            ref={inputRef}
            id="console-input"
            className="input"
            autoComplete="off"
            spellCheck={false}
            placeholder="Команда (help) или JS (например: mindbox.queue)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="btn-run" id="console-run" onClick={run}>
            Run
          </button>
        </div>

        <div className="console-hint">
          <span className="muted small">Enter — выполнить, ↑/↓ — история, Ctrl+L — очистить.</span>
        </div>
      </div>
    </section>
  );
}


