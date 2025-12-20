/* Shared UI + embedded console for Mindbox sandbox pages.
   Page-specific differences are provided via `window.__SANDBOX_CONFIG` in HTML. */

(function () {
  var cfg = window.__SANDBOX_CONFIG || {};

  function normalizeVariant(v) {
    var x = String(v || "").toLowerCase().trim();
    if (x === "proxy" || x === "direct") return x;
    return "";
  }

  var variant = normalizeVariant(cfg.variant);
  var trackerSrc = String(cfg.trackerSrc || "");
  if (!variant) {
    variant = trackerSrc.indexOf("/mindbox-tracker.js") === 0 ? "proxy" : "direct";
  }

  if (!trackerSrc) {
    trackerSrc = variant === "proxy"
      ? "/mindbox-tracker.js"
      : "https://api.mindbox.ru/scripts/v1/tracker.js";
  }

  var defaultFetchUrl = String(cfg.defaultFetchUrl || "/mindbox-tracker.js");
  var serviceWorkerPath = String(cfg.serviceWorkerPath || "/mindbox-services-worker.js");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderApp() {
    var app = document.getElementById("app");
    if (!app) {
      app = document.createElement("main");
      app.id = "app";
      document.body.appendChild(app);
    }
    app.className = "wrap";

    var badge = "tracker: " + variant;
    var path = location.pathname || "/";

    app.innerHTML =
      '<header class="hero">' +
      '  <div class="hero__title-row">' +
      '    <h1>Integration sandbox</h1>' +
      '    <span class="badge">' + escapeHtml(badge) + ' · <code>' + escapeHtml(path) + '</code></span>' +
      '  </div>' +
      '  <p class="muted">' +
      '    Тестовая страница для проверки загрузки трекера, работы Service Worker и сценариев web push. ' +
      '    Ниже — быстрые действия и встроенная консоль для логов и команд.' +
      '  </p>' +
      '  <div class="meta">' +
      '    <div class="meta__item">' +
      '      <span class="meta__k">Tracker</span>' +
      '      <span class="meta__v">' + escapeHtml(variant) + ' <code>' + escapeHtml(trackerSrc) + '</code></span>' +
      '    </div>' +
      '    <div class="meta__item">' +
      '      <span class="meta__k">Service Worker</span>' +
      '      <span class="meta__v"><code>' + escapeHtml(serviceWorkerPath) + '</code></span>' +
      '    </div>' +
      '  </div>' +
      '</header>' +

      '<section class="card">' +
      '  <h2>Немного filler-контента</h2>' +
      '  <p class="muted">' +
      '    Небольшие блоки и подсказки для ручных проверок: загрузка трекера, Service Worker, логи, ошибки и сетевые запросы.' +
      '  </p>' +
      '  <ul class="list">' +
      '    <li><strong>Точка входа</strong>: статический HTML, без сборки и внешних UI-библиотек.</li>' +
      '    <li><strong>Сценарий</strong>: ниже — встроенная консоль (REPL), которая дублирует <code>console.*</code>.</li>' +
      '    <li><strong>Форматирование</strong>: объекты печатаются как JSON с подсветкой.</li>' +
      '  </ul>' +
      '</section>' +

      '<section class="card">' +
      '  <h2>Быстрые действия</h2>' +
      '  <div class="actions">' +
      '    <button type="button" data-action="emit-log">console.log()</button>' +
      '    <button type="button" data-action="emit-warn">console.warn()</button>' +
      '    <button type="button" data-action="emit-error">console.error()</button>' +
      '    <button type="button" data-action="mindbox-queue">print mindbox.queue</button>' +
      '    <button type="button" data-action="fetch-tracker">fetch ' + escapeHtml(defaultFetchUrl) + '</button>' +
      '    <button type="button" data-action="sw-register">sw.register</button>' +
      '  </div>' +
      '  <p class="muted small">' +
      '    Подсказка: в консоли попробуй <code>help</code>, <code>clear</code>, <code>history</code> или любое JS-выражение ' +
      '    (например: <code>location.pathname</code>).' +
      '  </p>' +
      '</section>' +

      '<section class="card console-card">' +
      '  <div class="console-head">' +
      '    <h2>Встроенная консоль</h2>' +
      '    <div class="console-head__right">' +
      '      <button type="button" class="btn-ghost" data-console="help">Help</button>' +
      '      <button type="button" class="btn-ghost" data-console="copy">Copy</button>' +
      '      <button type="button" class="btn-ghost" data-console="clear">Clear</button>' +
      '    </div>' +
      '  </div>' +

      '  <div class="console" id="embedded-console">' +
      '    <div class="console-output" id="console-output" aria-label="Console output" role="log"></div>' +
      '    <div class="console-input">' +
      '      <span class="prompt">&gt;</span>' +
      '      <input id="console-input" class="input" autocomplete="off" spellcheck="false"' +
      '             placeholder="Команда (help) или JS (например: mindbox.queue)" />' +
      '      <button type="button" class="btn-run" id="console-run">Run</button>' +
      '    </div>' +
      '    <div class="console-hint">' +
      '      <span class="muted small">Enter — выполнить, ↑/↓ — история, Ctrl+L — очистить.</span>' +
      '    </div>' +
      '  </div>' +
      '</section>' +

      '<footer class="footer">' +
      '  <span class="muted small">' +
      '    Integration playground · built-in console · tracker: ' + escapeHtml(variant) + ' · path: <code>' + escapeHtml(path) + '</code>' +
      '  </span>' +
      '</footer>';
  }

  renderApp();

  (function () {
    var output = document.getElementById("console-output");
    var input = document.getElementById("console-input");
    var runBtn = document.getElementById("console-run");
    if (!output || !input || !runBtn) return;

    var storageKey = "__embeddedConsoleHistory:" + location.pathname;
    var history = [];
    var historyIdx = 0;

    function highlightJson(json) {
      var escaped = escapeHtml(json);
      return escaped.replace(
        /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        function (match) {
          var cls = "tok-number";
          if (match[0] === '"') cls = /:$/.test(match) ? "tok-key" : "tok-string";
          else if (match === "true" || match === "false") cls = "tok-boolean";
          else if (match === "null") cls = "tok-null";
          return '<span class="' + cls + '">' + match + "</span>";
        }
      );
    }

    function isDomElement(v) {
      return typeof Element !== "undefined" && v instanceof Element;
    }

    function safeStringify(value) {
      var seen = typeof WeakSet !== "undefined" ? new WeakSet() : null;
      return JSON.stringify(
        value,
        function (key, val) {
          if (typeof val === "bigint") return val.toString() + "n";
          if (typeof val === "function") return "[Function " + (val.name || "anonymous") + "]";
          if (typeof val === "symbol") return val.toString();
          if (!val || typeof val !== "object") return val;
          if (!seen) return val;
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
          return val;
        },
        2
      );
    }

    function formatValue(v) {
      try {
        if (v === undefined) return '<span class="tok-undefined">undefined</span>';
        if (v === null) return '<span class="tok-null">null</span>';
        if (typeof v === "string") return escapeHtml(v);
        if (typeof v === "number") return '<span class="tok-number">' + escapeHtml(v) + "</span>";
        if (typeof v === "boolean") return '<span class="tok-boolean">' + escapeHtml(v) + "</span>";
        if (typeof v === "bigint") return '<span class="tok-number">' + escapeHtml(v.toString()) + "n</span>";
        if (v instanceof Error) {
          var msg = (v && (v.stack || v.message)) ? (v.stack || v.message) : String(v);
          return '<span class="tok-error">' + escapeHtml(msg) + "</span>";
        }
        if (isDomElement(v)) {
          var desc = "<" + v.tagName.toLowerCase();
          if (v.id) desc += "#" + v.id;
          if (v.className && typeof v.className === "string") {
            var cls = v.className.trim().split(/\s+/).slice(0, 3).join(".");
            if (cls) desc += "." + cls;
          }
          desc += ">";
          return '<span class="tok-string">' + escapeHtml(desc) + "</span>";
        }
        if (typeof v === "object") {
          var json = safeStringify(v);
          return '<pre class="pre">' + highlightJson(json) + "</pre>";
        }
        return escapeHtml(String(v));
      } catch (e) {
        return '<span class="tok-error">[formatting error]</span>';
      }
    }

    function timeLabel(t) {
      try {
        return new Date(t || Date.now()).toLocaleTimeString("ru-RU", { hour12: false });
      } catch (e) {
        return "--:--:--";
      }
    }

    function appendLine(level, bodyHtml, t) {
      var stickToBottom = output.scrollTop + output.clientHeight >= output.scrollHeight - 18;

      var line = document.createElement("div");
      line.className = "console-line lvl-" + (level || "log");

      var time = document.createElement("div");
      time.className = "console-time";
      time.textContent = timeLabel(t);

      var body = document.createElement("div");
      body.className = "console-body";
      body.innerHTML = bodyHtml;

      line.appendChild(time);
      line.appendChild(body);
      output.appendChild(line);

      if (stickToBottom) output.scrollTop = output.scrollHeight;
    }

    function printEntry(entry) {
      if (!entry) return;
      if (entry.level === "clear") {
        output.textContent = "";
        return;
      }

      var args = entry.args || [];
      if (!args.length) {
        appendLine(entry.level || "log", '<span class="tok-dim">(no output)</span>', entry.t);
        return;
      }

      var parts = args.map(formatValue);
      appendLine(entry.level || "log", parts.join(' <span class="tok-dim"> </span>'), entry.t);
    }

    function flushBufferedConsole() {
      if (!window.__embeddedConsole || !window.__embeddedConsole.buffer) return;
      var buf = window.__embeddedConsole.buffer.slice();
      window.__embeddedConsole.buffer.length = 0;
      buf.forEach(printEntry);
    }

    function loadHistory() {
      try {
        var raw = localStorage.getItem(storageKey);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) history = parsed.slice(-200);
      } catch (e) {}
    }

    function saveHistory() {
      try { localStorage.setItem(storageKey, JSON.stringify(history.slice(-200))); } catch (e) {}
    }

    function setInputValue(v) {
      input.value = v || "";
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
    }

    function cmdHelp() {
      appendLine("info", [
        '<span class="tok-key">Commands</span>:',
        "<br><span class=\"tok-string\">help</span> — список команд",
        "<br><span class=\"tok-string\">clear</span> — очистить вывод (или Ctrl+L)",
        "<br><span class=\"tok-string\">history</span> — показать историю команд",
        "<br><span class=\"tok-string\">echo &lt;text&gt;</span> — вывести текст",
        "<br><span class=\"tok-string\">date</span> — текущая дата/время",
        "<br><span class=\"tok-string\">fetch [url]</span> — запрос (по умолчанию " + escapeHtml(defaultFetchUrl) + ")",
        "<br><span class=\"tok-string\">sw.register</span> — зарегистрировать Service Worker",
        "<br><span class=\"tok-string\">sw.unregister</span> — удалить Service Worker",
        "<br><span class=\"tok-string\">mindbox.queue</span> — показать mindbox.queue",
        "<br><span class=\"tok-dim\">Любая другая строка</span> — выполнится как JS в контексте страницы"
      ].join(""), Date.now());
    }

    function cmdHistory() {
      if (!history.length) {
        appendLine("info", "<span class=\"tok-dim\">History is empty</span>", Date.now());
        return;
      }
      var lines = history.slice(-50).map(function (x, idx) {
        var n = Math.max(0, history.length - 50) + idx + 1;
        return (n + ". " + x);
      }).join("\n");
      appendLine("info", '<pre class="pre">' + escapeHtml(lines) + "</pre>", Date.now());
    }

    function cmdFetch(url) {
      var target = (url || defaultFetchUrl).trim();
      appendLine("info", 'fetch <span class="tok-string">' + escapeHtml(target) + "</span> …", Date.now());
      return fetch(target, { cache: "no-store" })
        .then(function (res) {
          return res.text().then(function (text) {
            appendLine("info", "status " + res.status + " " + escapeHtml(res.statusText || ""), Date.now());
            var body = text.length > 2500 ? text.slice(0, 2500) + "\n…(truncated)" : text;
            appendLine("log", '<pre class="pre">' + escapeHtml(body) + "</pre>", Date.now());
          });
        })
        .catch(function (err) {
          appendLine("error", formatValue(err), Date.now());
        });
    }

    function cmdSwRegister() {
      if (!("serviceWorker" in navigator)) {
        appendLine("warn", "<span class=\"tok-dim\">Service Worker API недоступен в этом браузере</span>", Date.now());
        return;
      }
      appendLine("info", "register <span class=\"tok-string\">" + escapeHtml(serviceWorkerPath) + "</span> …", Date.now());
      navigator.serviceWorker.register(serviceWorkerPath)
        .then(function (reg) {
          appendLine("info", "registered scope: <span class=\"tok-string\">" + escapeHtml(reg.scope) + "</span>", Date.now());
        })
        .catch(function (err) {
          appendLine("error", formatValue(err), Date.now());
        });
    }

    function cmdSwUnregister() {
      if (!("serviceWorker" in navigator)) {
        appendLine("warn", "<span class=\"tok-dim\">Service Worker API недоступен</span>", Date.now());
        return;
      }
      navigator.serviceWorker.getRegistrations()
        .then(function (regs) {
          if (!regs.length) {
            appendLine("info", "<span class=\"tok-dim\">No registrations</span>", Date.now());
            return;
          }
          return Promise.all(regs.map(function (r) { return r.unregister(); }))
            .then(function (results) {
              appendLine("info", "unregister: " + escapeHtml(JSON.stringify(results)), Date.now());
            });
        })
        .catch(function (err) {
          appendLine("error", formatValue(err), Date.now());
        });
    }

    function cmdMindboxQueue() {
      var q = (window.mindbox && window.mindbox.queue) ? window.mindbox.queue : null;
      appendLine("info", "mindbox.queue = " + formatValue(q), Date.now());
    }

    var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    function evalJs(code) {
      try {
        var fnExpr = new AsyncFunction("context", "with (context) { return (" + code + "); }");
        return fnExpr(window);
      } catch (eExpr) {
        var fnStmt = new AsyncFunction("context", "with (context) { " + code + "\n }");
        return fnStmt(window);
      }
    }

    function runCommand(raw) {
      var code = String(raw || "").trim();
      if (!code) return;

      appendLine("cmd", '<span class="tok-dim">&gt;</span> ' + escapeHtml(code), Date.now());

      if (!history.length || history[history.length - 1] !== code) {
        history.push(code);
        saveHistory();
      }
      historyIdx = history.length;

      var parts = code.split(/\s+/);
      var cmd = parts[0];
      var rest = code.slice(cmd.length).trim();

      if (cmd === "help") return cmdHelp();
      if (cmd === "clear") { output.textContent = ""; return; }
      if (cmd === "history") return cmdHistory();
      if (cmd === "echo") { appendLine("log", escapeHtml(rest), Date.now()); return; }
      if (cmd === "date") { appendLine("log", '<span class="tok-string">' + escapeHtml(new Date().toString()) + "</span>", Date.now()); return; }
      if (cmd === "fetch") return cmdFetch(rest);
      if (cmd === "sw.register") return cmdSwRegister();
      if (cmd === "sw.unregister") return cmdSwUnregister();
      if (cmd === "mindbox.queue") return cmdMindboxQueue();

      Promise.resolve()
        .then(function () { return evalJs(code); })
        .then(function (result) {
          if (result !== undefined) appendLine("result", formatValue(result), Date.now());
        })
        .catch(function (err) {
          appendLine("error", formatValue(err), Date.now());
        });
    }

    function executeInput() {
      var code = input.value;
      setInputValue("");
      runCommand(code);
    }

    function copyOutput() {
      var text = output.innerText || "";
      function done(ok) {
        appendLine(ok ? "info" : "warn", ok ? "copied" : "copy failed", Date.now());
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () { done(false); });
        return;
      }
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        done(ok);
      } catch (e) {
        done(false);
      }
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        executeInput();
        return;
      }

      var key = (e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "l") {
        e.preventDefault();
        output.textContent = "";
        return;
      }

      if (e.key === "ArrowUp") {
        if (!history.length) return;
        e.preventDefault();
        historyIdx = Math.max(0, historyIdx - 1);
        setInputValue(history[historyIdx] || "");
        return;
      }

      if (e.key === "ArrowDown") {
        if (!history.length) return;
        e.preventDefault();
        historyIdx = Math.min(history.length, historyIdx + 1);
        setInputValue(historyIdx >= history.length ? "" : (history[historyIdx] || ""));
      }
    });

    runBtn.addEventListener("click", executeInput);

    document.querySelectorAll("[data-console]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-console");
        if (action === "clear") output.textContent = "";
        if (action === "help") cmdHelp();
        if (action === "copy") copyOutput();
      });
    });

    document.querySelectorAll("[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-action");
        if (action === "emit-log") console.log("hello from button", { ok: true, ts: Date.now(), path: location.pathname });
        if (action === "emit-warn") console.warn("warning example", { hint: "this is a sandbox", at: new Date().toISOString() });
        if (action === "emit-error") console.error(new Error("example error (button)"));
        if (action === "mindbox-queue") cmdMindboxQueue();
        if (action === "fetch-tracker") cmdFetch(defaultFetchUrl);
        if (action === "sw-register") cmdSwRegister();
      });
    });

    loadHistory();
    historyIdx = history.length;

    window.__embeddedConsoleSink = printEntry;

    appendLine("info", "Embedded console ready. Type <span class=\"tok-string\">help</span> or run JS.", Date.now());
    flushBufferedConsole();

    input.focus();
  })();
})();


