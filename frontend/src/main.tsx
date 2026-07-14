import "./index.css";

import { MathJaxContext } from "better-react-mathjax";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";

import App from "./App.tsx";
import { AuthProvider } from "./features/Auth/AuthContext.tsx";

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MathJaxContext version={3} config={config}>
      <AuthProvider>
        <ToastContainer />

        <App />
      </AuthProvider>
    </MathJaxContext>
  </StrictMode>,
);
