import { CiFolderOn } from "react-icons/ci";
import { useCreateMode } from "./context";
import { MdOutlineSubdirectoryArrowRight } from "react-icons/md";


export function QuestionDirectoryPreview() {
    const { files } = useCreateMode();

    return (
        <div className="flex flex-col gap-2 border rounded-2xl bg-gray-100 py-4 px-4">
            <h1 className="text-lg self-center">Directory Preview</h1>
            <div className="rounded-md border border-slate-200 bg-white p-3">
                {/* Root */}
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CiFolderOn className="text-lg text-slate-600" />
                    <span>question/</span>
                </div>
                {/* Files */}
                <div className="mt-2 flex flex-col gap-1 pl-5">
                    {files.map((file) => (
                        <div
                            key={file}
                            className="flex items-center gap-2 text-sm text-slate-700"
                        >
                            <MdOutlineSubdirectoryArrowRight className="text-slate-400" />
                            <span className="font-mono">{file}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}