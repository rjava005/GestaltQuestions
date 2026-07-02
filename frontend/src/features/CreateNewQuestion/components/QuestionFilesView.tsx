import { Checkbox } from "@mui/material";
import { useState } from "react";

import { Toggle } from "../../../components/Toggles";
import { ShowUploadedFiles, UploadFiles } from "../../../components/UploadFile";
import { QuestionDirectoryPreview } from "../../../components/UploadFile";
import { TemplateFiles } from "../constants/templateFiles";
import type { Filenames, QuestionFileSpec } from "../instance";
import { useQuestionCreate } from "../instance";

function QuestionFileDisplay({
  filename,
  required,
  isAdaptive,
  description,
}: QuestionFileSpec) {
  const add = useQuestionCreate((s) => s.addDefaultFile);
  const remove = useQuestionCreate((s) => s.removeDefaultFile);
  const selectedFiles = useQuestionCreate((s) => s.defaultFiles);
  const questionIsAdaptive = useQuestionCreate((s) => s.questionIsAdaptive);

  const adaptiveRequired = questionIsAdaptive && isAdaptive;
  const isChecked =
    required || adaptiveRequired || selectedFiles.includes(filename);

  if (required) {
    add(filename);
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as Filenames;
    const checked = event.target.checked;
    checked ? add(value) : remove(value);
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2 transition hover:border-border-strong">
      <Checkbox
        value={filename}
        checked={isChecked}
        onChange={handleChange}
        className="mt-0.5"
      />

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-text">
            {filename}
          </span>

          {required && (
            <span className="rounded-full border border-accent-strong/35 bg-accent-strong/15 px-2 py-0.5 text-[11px] font-semibold text-accent-strong">
              required
            </span>
          )}

          {!required && adaptiveRequired && (
            <span className="rounded-full border border-accent/35 bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
              required when adaptive
            </span>
          )}
        </div>

        <p className="text-sm text-text-muted">{description}</p>
      </div>
    </div>
  );
}

export default function QuestionFilesDisplay() {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<"combined" | "upload-only">(
    "combined",
  );
  const uploadedFiles = useQuestionCreate((s) => s.uploadedFiles);
  const setUploadedFiles = useQuestionCreate((s) => s.setUploadedFiles);
  const removeUploaded = useQuestionCreate((s) => s.removeUploadedFileByIndex);
  const defaultFiles = useQuestionCreate((s) => s.defaultFiles);
  const qdata = useQuestionCreate((s) => s.questionData);
  const isUploadOnly = uploadMode === "upload-only";
  const [showPreview, setShowPreview] = useState(false);

  return (
    <section className="h-full my-2 rounded-2xl border border-border bg-surface-strong/80 p-4 shadow-sm">
      <div className="flex flex-col gap-4  ">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-text">Question Files</h2>
            <p className="max-w-2xl text-sm text-text-muted">
              Pick the files for this question. Adaptive mode makes adaptive
              server files required.
            </p>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-surface-muted p-3 md:grid-cols-2">
            {/* Container for toggles */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-text-soft">
                File Selection Mode
              </span>
              <Toggle
                options={[
                  { value: "combined", label: "Checkboxes + Uploads" },
                  { value: "upload-only", label: "Upload Only" },
                ]}
                selected={uploadMode}
                onChange={(val) =>
                  setUploadMode(val as "combined" | "upload-only")
                }
                variant="compact"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-text-soft">
                File Uploads
              </span>
              <Toggle
                options={[
                  { value: "off", label: "Off" },
                  { value: "on", label: "On" },
                ]}
                selected={showUpload ? "on" : "off"}
                onChange={(val) => setShowUpload(val === "on")}
                variant="compact"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-text-soft">
                Show Directory
              </span>
              <Toggle
                options={[
                  { value: "off", label: "Off" },
                  { value: "on", label: "On" },
                ]}
                selected={showPreview ? "on" : "off"}
                onChange={(val) => setShowPreview(val === "on")}
                variant="compact"
              />
            </div>
          </div>

          {!isUploadOnly && (
            <div className="flex flex-col gap-2">
              {TemplateFiles.map((spec) => (
                <QuestionFileDisplay key={spec.filename} {...spec} />
              ))}
            </div>
          )}

          {showUpload && (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface p-3">
              <UploadFiles
                variant="editor"
                size="full"
                accept="any"
                message="Upload optional supporting files."
                onFilesSelected={(files) => setUploadedFiles(files)}
              />
              <ShowUploadedFiles
                files={uploadedFiles ?? []}
                onRemove={removeUploaded}
              />
            </div>
          )}
          {showPreview && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <QuestionDirectoryPreview
                directoryName={qdata?.title}
                files={defaultFiles}
                additionalFiles={uploadedFiles ?? []}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
