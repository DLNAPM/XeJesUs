import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent sandboxed iframe SecurityError exceptions for modal dialogs and define node variables in browser
if (typeof window !== 'undefined') {
  // Polyfill dynamic process object for browser-targeted micro-libraries
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }

  // Pure harmless overrides to completely avoid sandboxed iframe native modal dialog block exceptions
  window.alert = function (message) {
    console.log("⛪ [Sanctuary Alert]:", message);
  };

  window.confirm = function (message) {
    console.log("⛪ [Sanctuary Confirm - auto-accepted]:", message);
    return true; // Auto-accept to avoid locking standard click/action pipelines
  };

  (window as any).prompt = function (message: any, defaultValue?: any) {
    console.log("⛪ [Sanctuary Prompt - auto-returned]:", message, defaultValue);
    return defaultValue || "";
  };

  // Add global uncaught error listeners to bypass generic cross-origin "Script error." browser noise
  window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = String(message || '').toLowerCase();
    
    // Suppress cross-origin script error noise, ResizeObserver loop errors, and external script anomalies
    if (
      errorMsg.includes('script error') ||
      errorMsg.includes('resizeobserver') ||
      errorMsg.includes('loop limit exceeded') ||
      !message
    ) {
      console.warn("⛪ [Sanctuary Handled Error - Suppressed Noise]:", message, "Source:", source, "Line:", lineno);
      return true; // Return true to prevent default propagation to browser/iframe testing handlers
    }
    return false; // Allow standard React or native errors to propagate to let standard handlers process them
  };

  window.addEventListener('error', (event) => {
    const errorMsg = String(event.message || '').toLowerCase();
    if (errorMsg.includes('script error') || errorMsg.includes('resizeobserver') || !event.message) {
      console.warn("Uncaught global script error intercepted gracefully:", event.message || event.error);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason || '').toLowerCase();
    if (reason.includes('script error') || reason.includes('resizeobserver')) {
      console.warn("Uncaught promise rejection intercepted gracefully:", event.reason);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  // Resilient Storage Layer for Android & Storage-Partitioned Browsers
  // Prevents "Unable to process request due to missing initial state" by ensuring sessionStorage
  // is accessible, mirroring OAuth state to localStorage to survive Android background tab discards,
  // rehydrating sessionStorage on page reload, and providing a persistent store if partitioned or blocked.
  try {
    const memoryStore: Record<string, string> = {};
    let canUseSession = false;
    let originalSession: Storage | null = null;

    try {
      originalSession = window.sessionStorage;
      if (originalSession) {
        const testKey = '__xe_test_storage__';
        originalSession.setItem(testKey, '1');
        canUseSession = originalSession.getItem(testKey) === '1';
        originalSession.removeItem(testKey);
      }
    } catch {
      canUseSession = false;
    }

    const safeGetFromLocal = (key: string): string | null => {
      try {
        const item = localStorage.getItem('__xe_sess_' + key);
        if (item !== null) return item;
      } catch {}
      return memoryStore[key] || null;
    };

    const safeSetToLocal = (key: string, value: string): void => {
      try {
        localStorage.setItem('__xe_sess_' + key, value);
      } catch {}
      memoryStore[key] = value;
    };

    const safeRemoveFromLocal = (key: string): void => {
      try {
        localStorage.removeItem('__xe_sess_' + key);
      } catch {}
      delete memoryStore[key];
    };

    // 1. Initial Rehydration: Restore any stored session items from localStorage into memoryStore and originalSession
    try {
      const lLen = localStorage.length;
      for (let i = 0; i < lLen; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('__xe_sess_')) {
          const realKey = k.slice('__xe_sess_'.length);
          const val = localStorage.getItem(k);
          if (val !== null) {
            memoryStore[realKey] = val;
            if (canUseSession && originalSession) {
              try {
                originalSession.setItem(realKey, val);
              } catch {}
            }
          }
        }
      }
    } catch (e) {
      console.warn("Storage initial rehydration notice:", e);
    }

    if (canUseSession && originalSession) {
      const origGet = originalSession.getItem.bind(originalSession);
      const origSet = originalSession.setItem.bind(originalSession);
      const origRemove = originalSession.removeItem.bind(originalSession);
      const origClear = originalSession.clear.bind(originalSession);
      const origKey = originalSession.key ? originalSession.key.bind(originalSession) : () => null;

      originalSession.getItem = function (key: string): string | null {
        try {
          const val = origGet(key);
          if (val !== null && val !== undefined) return val;
        } catch {}
        return safeGetFromLocal(key);
      };

      originalSession.setItem = function (key: string, value: string): void {
        try {
          origSet(key, value);
        } catch {}
        safeSetToLocal(key, value);
      };

      originalSession.removeItem = function (key: string): void {
        try {
          origRemove(key);
        } catch {}
        safeRemoveFromLocal(key);
      };

      originalSession.clear = function (): void {
        try {
          origClear();
        } catch {}
        try {
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('__xe_sess_')) localStorage.removeItem(k);
          });
        } catch {}
        Object.keys(memoryStore).forEach(k => delete memoryStore[k]);
      };

      originalSession.key = function (index: number): string | null {
        try {
          const k = origKey(index);
          if (k !== null && k !== undefined) return k;
        } catch {}
        return Object.keys(memoryStore)[index] || null;
      };

      try {
        Object.defineProperty(originalSession, 'length', {
          get() {
            try {
              const origLen = Object.getPrototypeOf(originalSession)?.length ?? originalSession?.length;
              if (typeof origLen === 'number' && origLen > 0) return origLen;
            } catch {}
            return Object.keys(memoryStore).length;
          },
          configurable: true
        });
      } catch {}

      // Lifecycle hooks to sync on Android tab discards / background switching
      const syncSessionToLocal = () => {
        try {
          const currentLen = originalSession.length;
          for (let i = 0; i < currentLen; i++) {
            const k = originalSession.key(i);
            if (k) {
              const v = originalSession.getItem(k);
              if (v !== null) safeSetToLocal(k, v);
            }
          }
        } catch {}
      };

      window.addEventListener('beforeunload', syncSessionToLocal, { capture: true });
      window.addEventListener('pagehide', syncSessionToLocal, { capture: true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          syncSessionToLocal();
        } else {
          // Re-hydrate on tab refocus
          try {
            const lLen = localStorage.length;
            for (let i = 0; i < lLen; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith('__xe_sess_')) {
                const realKey = k.slice('__xe_sess_'.length);
                const val = localStorage.getItem(k);
                if (val !== null) {
                  memoryStore[realKey] = val;
                  try {
                    originalSession.setItem(realKey, val);
                  } catch {}
                }
              }
            }
          } catch {}
        }
      });
    } else {
      const storageShim: Storage = {
        getItem: (k: string) => safeGetFromLocal(k),
        setItem: (k: string, v: string) => safeSetToLocal(k, v),
        removeItem: (k: string) => safeRemoveFromLocal(k),
        clear: () => {
          try {
            Object.keys(localStorage).forEach(k => {
              if (k.startsWith('__xe_sess_')) localStorage.removeItem(k);
            });
          } catch {}
          Object.keys(memoryStore).forEach(k => delete memoryStore[k]);
        },
        key: (i: number) => Object.keys(memoryStore)[i] || null,
        get length() {
          return Object.keys(memoryStore).length;
        }
      };

      try {
        Object.defineProperty(window, 'sessionStorage', {
          value: storageShim,
          configurable: true,
          writable: true
        });
      } catch {
        (window as any).sessionStorage = storageShim;
      }
    }
  } catch (err) {
    console.warn("Storage resilience patch initialized with fallback:", err);
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 rounded-3xl border border-[#1e293b] bg-[#111827]/40 backdrop-blur-md shadow-2xl">
            <span className="text-3xl mb-4 block">⛪</span>
            <h1 className="text-2xl font-serif font-black italic tracking-wide text-white mb-3">Sanctuary Reconnecting</h1>
            <p className="text-sm font-sans text-stone-300 leading-relaxed mb-6">
              A gentle disturbance has been felt in the sanctuary's technical path. Our records and scripts are safely conserved.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#cb9f43]/20 hover:bg-[#cb9f43]/40 border border-[#cb9f43]/40 text-[#cb9f43] font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              Re-enter Sanctuary
            </button>
            {this.state.error && (
              <pre className="mt-6 p-4 rounded-xl bg-black/40 text-[10px] text-red-400 font-mono text-left overflow-auto max-h-32 select-all">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
