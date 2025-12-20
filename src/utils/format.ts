import { escapeHtml } from "./escapeHtml";

function highlightJson(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "tok-number";
      if (match[0] === '"') cls = /:$/.test(match) ? "tok-key" : "tok-string";
      else if (match === "true" || match === "false") cls = "tok-boolean";
      else if (match === "null") cls = "tok-null";
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function isDomElement(v: unknown): v is Element {
  return typeof Element !== "undefined" && v instanceof Element;
}

function safeStringify(value: unknown): string {
  const seen = typeof WeakSet !== "undefined" ? new WeakSet<object>() : null;

  return JSON.stringify(
    value,
    (_key, val: unknown) => {
      if (typeof val === "bigint") return `${val.toString()}n`;
      if (typeof val === "function") return `[Function ${(val as Function).name || "anonymous"}]`;
      if (typeof val === "symbol") return String(val);
      if (!val || typeof val !== "object") return val;
      if (!seen) return val;
      if (seen.has(val as object)) return "[Circular]";
      seen.add(val as object);
      return val;
    },
    2
  );
}

export function formatValueHtml(v: unknown): string {
  try {
    if (v === undefined) return '<span class="tok-undefined">undefined</span>';
    if (v === null) return '<span class="tok-null">null</span>';
    if (typeof v === "string") return escapeHtml(v);
    if (typeof v === "number") return `<span class="tok-number">${escapeHtml(v)}</span>`;
    if (typeof v === "boolean") return `<span class="tok-boolean">${escapeHtml(v)}</span>`;
    if (typeof v === "bigint") return `<span class="tok-number">${escapeHtml(v.toString())}n</span>`;

    if (v instanceof Error) {
      const msg = (v.stack || v.message) ? (v.stack || v.message) : String(v);
      return `<span class="tok-error">${escapeHtml(msg)}</span>`;
    }

    if (isDomElement(v)) {
      let desc = `<${v.tagName.toLowerCase()}`;
      if (v.id) desc += `#${v.id}`;
      if (typeof v.className === "string" && v.className) {
        const cls = v.className.trim().split(/\s+/).slice(0, 3).join(".");
        if (cls) desc += `.${cls}`;
      }
      desc += ">";
      return `<span class="tok-string">${escapeHtml(desc)}</span>`;
    }

    if (typeof v === "object") {
      const json = safeStringify(v);
      return `<pre class="pre">${highlightJson(json)}</pre>`;
    }

    return escapeHtml(String(v));
  } catch {
    return '<span class="tok-error">[formatting error]</span>';
  }
}


