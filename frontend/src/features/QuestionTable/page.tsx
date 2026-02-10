import { QuestionTable, TableToolBar } from ".";
import { useRetrievedQuestions } from "../../hooks";
import { useMemo } from "react";
import { Header } from "../../components/Header";
import { Divider } from "../../components/Divider";

export default function AllQuestions() {
  const questionFilter = useMemo(() => ({}), []);

  useRetrievedQuestions({
    questionFilter: questionFilter,
    showAllQuestions: false,
  });
  return (
    <>
      <Header title="All Questions" variant={"QuestionBuilder"} />
      <Divider />
      <TableToolBar />
      <Divider />
      <QuestionTable />
      <Divider />
    </>
  );
}
