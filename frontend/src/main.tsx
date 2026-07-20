import "./index.css";

import { MathJaxContext } from "better-react-mathjax";
import {
  Component,
  StrictMode,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";

/* =========================
   MathJax Config
========================= */
const config = {
  loader: {
    load: ["[tex]/ams"],
  },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    processEscapes: true,
  },
  options: {
    ignoreHtmlClass: "no-mathjax",
    processHtmlClass: "mathjax-process",
  },
};

type AppErrorBoundaryState = { error: Error | null };

class AppErrorBoundary extends Component<
  { children: ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application render failed:", error, info);
  }

  render() {
    if (this.state.error) {
      return <StartupError error={this.state.error} />;
    }

    return this.props.children;
  }
}

function StartupError({ error }: { error: Error }) {
  return (
    <main className="min-h-screen bg-bg px-6 py-12 text-text">
      <div className="mx-auto max-w-3xl rounded-lg border border-red-400/40 bg-red-950/40 p-6">
        <h1 className="text-xl font-bold text-red-200">
          The application could not start
        </h1>
        <p className="mt-3 text-red-100">{error.message}</p>
        <p className="mt-4 text-sm text-text-muted">
          Check the browser console for the full stack trace.
        </p>
      </div>
    </main>
  );
}

async function startApplication() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Missing required root element with id "root"');
  }

  try {
    const [{ default: App }, { AuthProvider }] = await Promise.all([
      import("./App.tsx"),
      import("./features/Auth/AuthContext.tsx"),
    ]);

    createRoot(rootElement).render(
      <StrictMode>
        <AppErrorBoundary>
          <MathJaxContext version={3} config={config}>
            <AuthProvider>
              <ToastContainer />

              <App />
            </AuthProvider>
          </MathJaxContext>
        </AppErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    const startupError =
      error instanceof Error ? error : new Error(String(error));
    console.error("Application startup failed:", startupError);
    createRoot(rootElement).render(<StartupError error={startupError} />);
  }
}

void startApplication();
