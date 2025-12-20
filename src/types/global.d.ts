export {};

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }

  interface PwaInstallState {
    deferredPrompt: BeforeInstallPromptEvent | null;
    installed: boolean;
  }

  interface SandboxConfig {
    variant?: string;
    trackerSrc?: string;
    endpointId?: string;

    defaultFetchUrl?: string;
    serviceWorkerPath?: string;
    switchToPath?: string;

    pwa?: boolean;
    pwaInstallPrompt?: boolean;
    autoFocusInput?: boolean;
  }

  interface CapturedConsoleEntry {
    t: number;
    level: string;
    args: unknown[];
  }

  interface EmbeddedConsoleState {
    buffer: CapturedConsoleEntry[];
    original: Record<string, (...args: unknown[]) => void>;
    levels: string[];
  }

  interface MindboxFunction {
    queue?: unknown[];
    (...args: unknown[]): void;
  }

  interface Window {
    __SANDBOX_CONFIG?: SandboxConfig;

    __embeddedConsole?: EmbeddedConsoleState;
    __embeddedConsoleSink?: (entry: CapturedConsoleEntry) => void;

    __mindboxSandboxBootstrap?: boolean;
    __mindboxSandboxErrorHooks?: boolean;

    __pwaInstallPromptCapture?: boolean;
    __pwaInstall?: PwaInstallState;

    mindbox?: MindboxFunction;
  }

  // set in HTML (without `var`)
  // eslint-disable-next-line no-var
  var mindbox: MindboxFunction;
}


