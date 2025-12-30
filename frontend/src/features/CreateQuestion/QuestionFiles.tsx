import Checkbox from "@mui/material/Checkbox";
import Divider from "../../components/Base/Divider";
import { useEffect } from "react";
import { type Filenames, useCreateMode } from "./context";

type QuestionFileSpec = {
    filename: Filenames;
    required: boolean;
    description: string;
    isAdaptive: boolean;
};


const QUESTION_FILE_SPECS: QuestionFileSpec[] = [
    {
        filename: "question.html",
        required: true,
        isAdaptive: false,
        description: "Defines the question content and user inputs.",
    },
    {
        filename: "solution.html",
        required: false,
        isAdaptive: false,
        description: "Provides an optional worked solution or explanation.",
    },
    {
        filename: "server.js",
        required: false,
        isAdaptive: true,
        description: "Generates dynamic parameters for adaptive questions.",
    },
    {
        filename: "server.py",
        required: false,
        isAdaptive: false,
        description: "Generates dynamic parameters for adaptive questions.",
    },
];

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

    return (
        <div className="flex flex-col gap-2 border rounded-2xl bg-gray-100 py-4 px-4">
            <h1 className="text-lg self-center">Files for Question</h1>
            <Divider />
            {QUESTION_FILE_SPECS.map((v) => QuestionFileDisplay(v))}
        </div>
    );
}
