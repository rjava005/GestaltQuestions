import { MathJaxContext } from "better-react-mathjax";
import QuestionSettingsProvider from "./context/GeneralSettingsContext";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./features/NavBar/NavBar";
import { ToastContainer } from "react-toastify";
import CodeEditorProvider from "./context/CodeEditorContext";
import { QuestionCollectionProvider } from "./context/QuestionCollectionContext";
import { QuestionRuntimeProvider } from "./context/QuestionAnswerContext";
import { AuthModeProvider } from "./context/AuthMode";
import { QuestionTableProvider } from "./features/QuestionTable/QuestionTableContext";
import {
  QuestionBuilderProvider,
  QuestionCollectionViewProvider,
} from "./features/QuestionBuilder";
import CreateQuestionProvider from "./features/CreateQuestion/context";

const config = {
  loader: { load: ["[tex]/ams"] },
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

function App() {
  return (
    <AuthProvider>
      <CreateQuestionProvider>
        <QuestionCollectionViewProvider>
          <QuestionCollectionProvider>
            <QuestionBuilderProvider>
              <QuestionTableProvider>
                <MathJaxContext version={3} config={config}>
                  <AuthModeProvider>
                    <QuestionRuntimeProvider>
                      <QuestionSettingsProvider>
                        <QuestionCollectionProvider>
                          <CodeEditorProvider>
                            {/* Main Content */}
                            <NavBar />
                            <ToastContainer />

                            {/* <LecturePage /> */}
                            {/* <LegacyQuestion /> */}
                            {/* End of Main Content */}
                          </CodeEditorProvider>
                        </QuestionCollectionProvider>
                      </QuestionSettingsProvider>
                    </QuestionRuntimeProvider>
                  </AuthModeProvider>
                </MathJaxContext>
              </QuestionTableProvider>
            </QuestionBuilderProvider>
          </QuestionCollectionProvider>
        </QuestionCollectionViewProvider>
      </CreateQuestionProvider>
    </AuthProvider>
  );
}

export default App;
