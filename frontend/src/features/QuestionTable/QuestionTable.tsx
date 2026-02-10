import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
} from "@mui/material";
import { useQuestionCollectionContext } from "./../../context/QuestionCollectionContext";
import { useQuestionTableContext } from "./context";
import { Checkbox } from "@mui/material";
import { QuestionTableColumns } from "./config";
import { useNavigate } from "react-router-dom";

export default function QuestionTable() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();

  const {
    selectedQuestionID,
    setSelectedQuestionID,
    setSelectedQuestions,
    selectedQuestions,
    questions,
  } = useQuestionCollectionContext();
  const { multiSelect, setResetKey, resetKey, columns, setColumns } =
    useQuestionTableContext();

  const paged = useMemo(
    () => questions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [questions, page, rowsPerPage]
  );
  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

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

  useEffect(() => {
    setColumns(QuestionTableColumns.filter((v) => v.default) ?? []);
  }, []);
  console.log("These are the keys on mount", columns);

  return (
    <div className="w-full mt-10">
      <TableContainer
        component={Paper}
        className="rounded-lg shadow-md dark:bg-gray-900"
      >
        <Table aria-label="question table" stickyHeader>
          {/* Define the table cols */}
          <TableHead>
            <TableRow>
              {columns.map((v, index) => {
                // Skip the first column when multiSelect is true
                if (!multiSelect && v.key === "select") return null;
                if (v.default)
                  return <TableCell key={index}>{v.key}</TableCell>;

                return <TableCell key={index}>{v.key}</TableCell>;
              })}
            </TableRow>
          </TableHead>
          {/* The Actual Body of the questions */}
          <TableBody>
            {/* {paged.map((q) => (
                            <QuestionRow key={q.id} question={q} />
                        ))} */}
            {paged.map((question) => (
              <TableRow key={question.id}>
                {columns.map((col) => {
                  if (col.key === "select") {
                    if (!multiSelect) return null;
                    else
                      return (
                        <Checkbox
                          key={resetKey}
                          checked={selectedQuestions.includes(
                            question.id ?? ""
                          )}
                          value={question.id}
                          onChange={handleChange}
                        />
                      );
                  }

                  // Handle the question title selection
                  if (col.key === "title") {
                    return (
                      <TableCell
                        key={question.id}
                        onClick={() => {
                          setSelectedQuestionID(question.id ?? "");

                          return navigate("/question_builder/current");
                        }}
                      >
                        {col.render
                          ? col.render(
                            question,
                            selectedQuestionID === question.id
                              ? "font-semibold text-indigo-700"
                              : ""
                          )
                          : null}
                      </TableCell>
                    );
                  } else {
                    return (
                      <TableCell key={col.key}>
                        {col.render ? col.render(question) : null}
                      </TableCell>
                    );
                  }
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="flex justify-end mt-4">
        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          count={questions.length}
          component="div"
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>
    </div>
  );
}
