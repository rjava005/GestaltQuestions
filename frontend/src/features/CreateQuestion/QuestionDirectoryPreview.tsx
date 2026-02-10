import { CiFolderOn } from "react-icons/ci";
import { useCreateMode } from "./context";
import { MdOutlineSubdirectoryArrowRight } from "react-icons/md";




function FilePreview({ filename }: { filename: string }) {
    return (
        <div
            key={filename}
            className="flex items-center gap-2 text-sm text-slate-700"
        >
            <MdOutlineSubdirectoryArrowRight className="text-slate-400 shrink-0" />
            <span className="font-mono">{filename}</span>
        </div>
    );
}

function FolderHeader({ name }: { name: string }) {
    return (
        <div className="flex items-center gap-2 text-slate-800 font-medium">
            <CiFolderOn className="text-lg text-slate-600 shrink-0" />
            <span>{name}</span>
        </div>
    );
}

export function QuestionDirectoryPreview() {
    const { files, additionalFiles } = useCreateMode();

    return (
        <section className="flex flex-col gap-3 rounded-2xl border bg-gray-100 px-4 py-4">
            <h2 className="text-base font-semibold text-slate-700 self-center">
                Directory Preview
            </h2>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
                {/* Root folder */}
                <FolderHeader name="question/" />

                {/* Root files */}
                <div className="mt-2 flex flex-col gap-1 pl-6">
                    {files.map((file) => (
                        <FilePreview key={file} filename={file} />
                    ))}

                    {/* Nested folder */}
                    {additionalFiles?.length > 0 && (
                        <div className="mt-2">
                            <FolderHeader name="clientFiles/" />

                            <div className="mt-1 flex flex-col gap-1 pl-6">
                                {additionalFiles.map((file) => (
                                    <FilePreview key={file.name} filename={file.name} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}