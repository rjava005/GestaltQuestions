import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { Header } from "../components/Header";
import { ComponentPlayGround } from "../features/ComponentPlayGround";
import CreateQuestionFromBlank from "../features/CreateNewQuestion/CreateNewQuestion";
import { QuestionCreateProvider } from "../features/CreateNewQuestion/instance";
import { MyQuestionsTable } from "../features/QuestionTables";

export default function QuestionBuilderPage() {
  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <header className="mb-4 rounded-lg border border-border bg-surface p-4">
        <h1 className="text-xl font-semibold">Question Workspace</h1>
        <p className="text-sm text-text-muted">
          Build from scratch, browse your questions, edit existing ones, or
          explore component markup.
        </p>

        <nav className="mt-3 flex gap-2">
          <NavLink
            to="/question_builder/questions"
            end
            className={({ isActive }) =>
              isActive
                ? "rounded-md border border-border-strong bg-surface-strong px-3 py-1.5 text-sm"
                : "rounded-md border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
            }
          >
            My Questions
          </NavLink>

          <NavLink
            to="/question_builder/questions/new"
            className={({ isActive }) =>
              isActive
                ? "rounded-md border border-border-strong bg-surface-strong px-3 py-1.5 text-sm"
                : "rounded-md border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
            }
          >
            New Question
          </NavLink>

          <NavLink
            to="/question_builder/playground"
            className={({ isActive }) =>
              isActive
                ? "rounded-md border border-border-strong bg-surface-strong px-3 py-1.5 text-sm"
                : "rounded-md border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
            }
          >
            Component Playground
          </NavLink>
          <NavLink
            to="/question_builder/chat"
            end
            className={({ isActive }) =>
              isActive
                ? "rounded-md border border-border-strong bg-surface-strong px-3 py-1.5 text-sm"
                : "rounded-md border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
            }
          >
            Chat
          </NavLink>
        </nav>
      </header>

      <main className="bg-surface p-4">
        <Outlet />
      </main>
    </div>
  );
}

export function QuestionsListPage() {
  const navigate = useNavigate();

  return (
    <MyQuestionsTable
      onQuestionSelect={(qid) =>
        navigate(`/question_builder/questions/${qid}/edit`)
      }
    />
  );
}

export function CreateNewQuestion() {
  return (
    <QuestionCreateProvider>
      <Header
        variant="QuestionBuilder"
        title="Create Question"
        className="flex flex-row justify-between"
      />
      <CreateQuestionFromBlank />
    </QuestionCreateProvider>
  );
}

export function QuestionBuilderPlaygroundPage() {
  return <ComponentPlayGround />;
}
