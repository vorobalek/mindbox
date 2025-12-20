import type { SandboxVariant } from "../utils/runtimeConfig";

export function Footer(props: { variant: SandboxVariant; path: string }) {
  const { variant, path } = props;

  return (
    <footer className="footer">
      <span className="muted small">
        Integration playground · built-in console · tracker: {variant} · path: <code>{path}</code>
      </span>
    </footer>
  );
}


