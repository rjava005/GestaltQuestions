import clsx from "clsx";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { FaCopy, FaDownload, FaFilter } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { TbColumns3Filled } from "react-icons/tb";

import { SearchBar } from "../../../../components/SearchBar";
import type { QuestionTableColumn } from "../../config/columns";
import { useQuestionTableContext } from "../../instance/context";
import { QuestionTableColumnVisibility } from "./QuestionTableColumnVisibility";
type QuestionTableToolBarProps = {
  columns: QuestionTableColumn[];
  showDelete?: boolean;
};

function toolbarButtonClass(variant: "default" | "danger" = "default") {
  const base =
    "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45";

  if (variant === "danger") {
    return `${base} border-red-500/25 bg-red-500/15 text-red-300 hover:bg-red-500/25`;
  }

  return `${base} border-slate-700/80 bg-slate-900/70 text-slate-100 hover:bg-slate-800`;
}

export default function QuestionTableToolBar({
  columns,
  showDelete = true,
}: QuestionTableToolBarProps) {
  const [showColumns, setShowColumns] = useState(false);
  const searchTitle = useQuestionTableContext((s) => s.search);
  const setSearchTitle = useQuestionTableContext((s) => s.setSearch);
  const selectedIds = useQuestionTableContext((s) => s.selectedIDs);
  const filters = useQuestionTableContext((s) => s.filters);
  const clearFilters = useQuestionTableContext((s) => s.clearFilters);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hasSelectedRows = selectedIds.length > 0;
  const hasActiveFilters = Object.keys(filters).length > 0;

  useEffect(() => {
    if (!showColumns) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (containerRef.current && !containerRef.current.contains(target)) {
        setShowColumns(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumns]);

  return (
    <div
      ref={containerRef}
      className=" relative  rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg"
    >
      <div className=" flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full md:max-w-xs">
          <SearchBar
            value={searchTitle}
            setValue={setSearchTitle}
            disabled={false}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
          <button
            type="button"
            disabled={!hasSelectedRows}
            onClick={() => console.log("Copy")}
            className={toolbarButtonClass()}
          >
            <FaCopy className="h-3.5 w-3.5" />
            Copy
          </button>

          <button
            type="button"
            disabled={!hasSelectedRows}
            onClick={() => console.log("download")}
            className={toolbarButtonClass()}
          >
            <FaDownload className="h-3.5 w-3.5" />
            Download
          </button>

          {showDelete ? (
            <button
              type="button"
              disabled={!hasSelectedRows}
              onClick={() => console.log("Delete")}
              className={toolbarButtonClass("danger")}
            >
              <MdDelete className="h-4 w-4" />
              Delete
            </button>
          ) : null}

          <button
            type="button"
            aria-expanded={showColumns}
            onClick={() => setShowColumns((current) => !current)}
            className={clsx(toolbarButtonClass())}
          >
            <TbColumns3Filled className="h-4 w-4" />
            Columns
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-slate-800 pt-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700/80 bg-slate-900/70 text-slate-300">
          <FaFilter className="h-3.5 w-3.5" />
        </span>
        <button
          type="button"
          disabled={!hasActiveFilters}
          onClick={clearFilters}
          className="text-sm font-semibold text-blue-400 transition hover:text-blue-300 disabled:cursor-not-allowed disabled:text-slate-600"
        >
          Clear all filters
        </button>
      </div>

      {showColumns && (
        <div className="absolute right-4 top-full z-20 mt-2 w-64">
          <QuestionTableColumnVisibility columns={columns} />
        </div>
      )}
    </div>
  );
}
