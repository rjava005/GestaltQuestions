import Checkbox from "@mui/material/Checkbox";
import Divider from "../../components/Divider/Divider";
import { useEffect } from "react";
import { type Filenames, type QuestionFileSpec } from "./types";
import { useCreateMode } from "./context";
import { QUESTION_FILE_SPECS } from "./config";
import { UploadFiles } from "../../components/UploadFile";
import { ToggleField } from "../../components/Toggles";
import { useState } from "react";
function QuestionFileDisplay({
    filename,
    required,
    isAdaptive,
    description,
}: QuestionFileSpec) {
    const { setFiles, files, isAdaptive: isAdaptiveChecked } = useCreateMode();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as Filenames;
        const checked = event.target.checked;

        setFiles((prev) => {
            if (checked) {
                return prev.includes(value) ? prev : [...prev, value];
            }
            return prev.filter((f) => f !== value);
        });
    };

    useEffect(() => {
        if (!isAdaptive) return;
        setFiles((prev) => {
            if (isAdaptiveChecked) {
                return prev.includes(filename) ? prev : [...prev, filename];
            }
            return prev.filter((f) => f !== filename);
        });
    }, [isAdaptiveChecked, isAdaptive, filename, setFiles]);


    const isChecked = files.includes(filename) || required || (isAdaptiveChecked && isAdaptive);

    return (
        <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition">
            <Checkbox
                value={filename}
                checked={isChecked}
                disabled={required || (isAdaptiveChecked && isAdaptive)}
                onChange={handleChange}
                className="mt-1"
            />

            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-slate-900">
                        {filename}
                    </span>

                    {required || (isAdaptive && isAdaptiveChecked) && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                            required
                        </span>
                    )}
                </div>

                <p className="text-sm text-slate-500">{description}</p>
            </div>

        </div>
    );
}



export default function QuestionFiles() {
    const { setAdditionalFiles } = useCreateMode();
    const [showExtras, setShowExtras] = useState(false);

    return (
        <section className="flex flex-col gap-4 rounded-2xl border bg-gray-100 px-4 py-4 my-2">
            {/* Header */}
            <div className="flex flex-col items-center gap-1">
                <h2 className="text-lg font-semibold text-slate-800">
                    Question Files
                </h2>
                <p className="text-sm text-slate-500 text-center max-w-sm">
                    Select the core files required to build your question.
                </p>
            </div>

            <Divider />

            {/* Required / Standard Files */}
            <div className="flex flex-col gap-2">
                {QUESTION_FILE_SPECS.map((spec) => QuestionFileDisplay(spec))}
            </div>

            <Divider />

            {/* Optional Assets Toggle */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800">
                        Optional supporting files
                    </span>
                    <span className="text-sm text-slate-500">
                        Upload assets like images (<code>.png</code>, <code>.jpg</code>),
                        data files, or other resources your question may need.
                    </span>
                </div>

                <ToggleField
                    id="extra_files"
                    checked={showExtras}
                    setToggle={() => setShowExtras((prev) => !prev)}
                    label=""
                />
            </div>

            {/* Upload Area */}
            {showExtras && (
                <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-white p-3">
                    <UploadFiles
                        variant="outline"
                        size="sm"
                        accept="images"
                        onFilesSelected={(files) => setAdditionalFiles(files)}
                    />

                </div>
            )}
        </section>
    );
}