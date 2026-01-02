import React, { useEffect } from "react";
import clsx from "clsx";
import { Checkbox, TableCell, TableRow } from "@mui/material";
import { type QuestionMeta } from "../../types/questionTypes";
import { useQuestionCollectionContext } from "../../context/QuestionCollectionContext";
import { useQuestionTableContext } from "./QuestionTableContext";

type Props = {
  question: QuestionMeta;
};

export function QuestionRow({ question }: Props) {
  const { multiSelect, setResetKey, resetKey } = useQuestionTableContext();
  // Handle the select of the title
  const {
    selectedQuestionID,
    setSelectedQuestionID,
    setSelectedQuestions,
    selectedQuestions,
  } = useQuestionCollectionContext();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;

    setSelectedQuestions((prev) => {
      if (checked) {
        return prev.includes(value) ? prev : [...prev, value];
      } else {
        return prev.filter((v) => v !== value);
      }
    });
  };

  useEffect(() => {
    // Clear selected list
    setSelectedQuestions([]);
    // Force checkboxes to reset by giving them a new key
    setResetKey((k) => k + 1);
  }, [multiSelect]);

  if (!question.id) return null;

  return (
    <TableRow hover role="row" className={clsx("transition-colors")}>
      {/* Multi-select Checkbox */}
      {multiSelect && (
        <TableCell>
          <Checkbox
            key={resetKey}
            checked={selectedQuestions.includes(question.id)}
            value={question.id}
            onChange={handleChange}
          />
        </TableCell>
      )}

      {/* Question Title */}
      <TableCell>
        <div
          key={question.id}
          onClick={() => setSelectedQuestionID(question.id ?? "")}
          className={clsx(
            "flex items-center gap-2",
            "cursor-pointer select-none",
            "text-base font-medium",
            "transition-all duration-300 ease-in-out",
            selectedQuestionID === question.id &&
            "font-semibold text-indigo-700"
          )}
        >
          {question.title}
        </div>
      </TableCell>

      {/* Adaptive / Non-Adaptive Badge */}
      <TableCell>
        <span
          className={clsx(
            "w-full px-2 py-1 rounded-full text-lg font-semibold",
            question.isAdaptive
              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          )}
        >
          {question.isAdaptive ? "Adaptive" : "Non-Adaptive"}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={clsx(
            "w-full px-2 py-1 rounded-full text-lg font-semibold",
            question.isAdaptive
              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          )}
        >
          {question.isAdaptive ? "Adaptive" : "Non-Adaptive"}
        </span>
      </TableCell>
    </TableRow>
  );
}
