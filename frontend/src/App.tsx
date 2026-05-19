import { BrowserRouter, Routes, Navigate, Route, } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import { Home, QuestionBuilder, Questions, LoginPage, AccountPage, EditQuestionPage } from "./pages";
import { RequireRole } from "./features/Auth";
import { QuestionsListPage, CreateNewQuestion, QuestionBuilderPlaygroundPage } from "./pages/QuestionBuilder";
import { GeneralQuestionRender } from "./pages/Questions";
import StreamChat from "./features/Chat/Chat";

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
                <Route path="questions/:qid/edit" element={<EditQuestionPage />} />
                <Route path="playground" element={<QuestionBuilderPlaygroundPage />} />
                <Route path="chat" element={<StreamChat />} />
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
