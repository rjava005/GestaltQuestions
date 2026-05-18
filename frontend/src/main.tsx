import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/Auth/AuthContext.tsx'
import { MathJaxContext } from "better-react-mathjax";
import { DevTableProvider, AllTableProvider } from "./features/QuestionTables/instance/context";
import { ToastContainer } from "react-toastify";
import { ChatProvider } from './features/Chat/instance/context.tsx'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    
      <MathJaxContext version={3} config={config}>
        <AuthProvider>
          <ChatProvider>
          <AllTableProvider>
            <DevTableProvider>
              <ToastContainer />

              <App />
            </DevTableProvider>
          </AllTableProvider>
          </ChatProvider>
        </AuthProvider>
      </MathJaxContext>
    
  </StrictMode>,
)
