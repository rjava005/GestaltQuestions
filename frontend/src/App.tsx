import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RequireRole } from "./features/Auth";
import QuestionWorkspace from "./features/QuestionWorkspace/QuestionWorkspace";
import AppLayout from "./layouts/AppLayout";
import {
  AccountPage,
  Home,
  LoginPage,
  QuestionBuilder,
  Questions,
} from "./pages";
import ChatPage from "./pages/ChatPage";
import {
  CreateNewQuestion,
  QuestionBuilderPlaygroundPage,
  QuestionsListPage,
} from "./pages/QuestionBuilder";
import { GeneralQuestionRender } from "./pages/Questions";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account" element={<AccountPage />} />

            <Route path="/questions" element={<Questions />} />
            <Route path="/questions/:qid" element={<GeneralQuestionRender />} />

            {/* Non User Specific */}

            {/* Developer Only Routes */}
            <Route element={<RequireRole allow={["admin", "developer"]} />}>
              <Route path="/question_builder" element={<QuestionBuilder />}>
                <Route path="questions" element={<QuestionsListPage />} />
                <Route index element={<QuestionsListPage />} />
                <Route path="questions/new" element={<CreateNewQuestion />} />
                <Route
                  path="questions/:qid/edit"
                  element={<QuestionWorkspace />}
                />
                <Route
                  path="playground"
                  element={<QuestionBuilderPlaygroundPage />}
                />
                <Route path="chat" element={<ChatPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
export default App;
