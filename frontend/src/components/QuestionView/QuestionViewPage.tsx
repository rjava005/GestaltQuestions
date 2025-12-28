
import { QuestionTable } from "../QuestionTable/QuestionTable";
import { ResizableQuestionContainer } from "../Question/ResizableQuestion";
import SyncQuestions from "../QuestionSync/QuestionSync";
import { useQuestionContext } from "../../context/QuestionCollectionContext";
import QuestionPageHeader from "./QuestionPageHeader";
import QuestionViewToolBar from "./QuestionViewToolBar";

export function QuestionViewPage() {
  const { selectedQuestionID } = useQuestionContext();

  return (
    <section className="w-full flex flex-col items-center py-12 space-y-16">
      {/* Dashboard Section */}
      <div className="w-full max-w-5xl flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-baseline gap-x-5">
          <QuestionPageHeader />
          <SyncQuestions />

        </div>

        {/* Filters & Table */}
        <div className="w-full">
          {/* <QuestionFiltering /> */}
          <QuestionViewToolBar />

          <section className="mt-10 flex justify-center w-full">
            <QuestionTable />
          </section>
        </div>
      </div>

      {/* Question Detail View */}
      {selectedQuestionID && (
        <div className="w-full px-4 sm:px-8">
          <ResizableQuestionContainer />
        </div>
      )}
    </section>
  );
}
