/* Shared early bootstrap for Mindbox sandbox pages:
   - captures console output before UI is mounted
   - stubs `mindbox()` and queues calls before tracker loads
   - forwards window errors into console (so they show up in the embedded console) */

(function () {
  if (window.__mindboxSandboxBootstrap) return;
  window.__mindboxSandboxBootstrap = true;

  // Embedded console bootstrap: captures console output before UI is mounted
  (function () {
    if (window.__embeddedConsole) return;

    if (!window.console) window.console = {};

    var buffer = [];
    var original = {};
    var levels = ["log", "info", "warn", "error", "debug"];

    function push(level, args) {
      var entry = {
        t: Date.now(),
        level: level,
        args: Array.prototype.slice.call(args || [])
      };

      buffer.push(entry);

      if (typeof window.__embeddedConsoleSink === "function") {
        try { window.__embeddedConsoleSink(entry); } catch (e) {}
      }
    }

    levels.forEach(function (level) {
      var fn = typeof console[level] === "function" ? console[level].bind(console) : function () {};
      original[level] = fn;
      console[level] = function () {
        push(level, arguments);
        try { fn.apply(console, arguments); } catch (e) {}
      };
    });

    var clearFn = typeof console.clear === "function" ? console.clear.bind(console) : function () {};
    original.clear = clearFn;
    console.clear = function () {
      push("clear", []);
      try { clearFn(); } catch (e) {}
    };

    window.__embeddedConsole = {
      buffer: buffer,
      original: original,
      levels: levels
    };
  })();

  // Mindbox stub + init (must run before tracker script executes)
  (function () {
    var cfg = window.__SANDBOX_CONFIG || {};
    var endpointId = cfg.endpointId || "testing.vorobalek";

    window.mindbox = window.mindbox || function () { window.mindbox.queue.push(arguments); };
    window.mindbox.queue = window.mindbox.queue || [];

    try { window.mindbox("create", { endpointId: endpointId }); } catch (e) {}
    try { window.mindbox("webpush.create"); } catch (e) {}
  })();

  // Forward global errors into console
  (function () {
    if (window.__mindboxSandboxErrorHooks) return;
    window.__mindboxSandboxErrorHooks = true;

    window.addEventListener("error", function (ev) {
      try {
        console.error(ev.error || (ev.message ? new Error(ev.message) : "Window error"));
      } catch (e) {}
    });

    window.addEventListener("unhandledrejection", function (ev) {
      try { console.error(ev.reason || "Unhandled rejection"); } catch (e) {}
    });
  })();
})();


