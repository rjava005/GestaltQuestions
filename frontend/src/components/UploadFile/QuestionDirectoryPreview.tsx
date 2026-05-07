import { MdOutlineSubdirectoryArrowRight } from "react-icons/md";
import { CiFolderOn } from "react-icons/ci";
import type { Filenames } from "../../features/CreateNewQuestion/instance";

function FilePreview({ filename }: { filename: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-text-muted">
      <MdOutlineSubdirectoryArrowRight className="shrink-0 text-text-soft" />
      <span className="font-mono text-text">{filename}</span>
    </div>
  );
}

function FolderHeader({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 font-semibold text-text">
      <CiFolderOn className="shrink-0 text-lg text-accent" />
      <span>{name}</span>
    </div>
  );
}

type QuestionDirectoryPreviewProps = {
  directoryName?: string;
  files: Filenames[] | string[];
  additionalFiles: File[];
  includeClientDirectory?: boolean;
};

export function QuestionDirectoryPreview({
  directoryName = "Directory",
  files,
  additionalFiles,
  includeClientDirectory = false,
}: QuestionDirectoryPreviewProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="self-center text-base font-semibold text-text">
        Directory Preview
      </h2>

      <div className="rounded-xl border border-border bg-surface-strong p-4">
        <FolderHeader name={`${directoryName}/`} />

        <div className="mt-2 flex flex-col gap-1 pl-6">
          {files.map((file) => (
            <FilePreview key={file} filename={file} />
          ))}

          {additionalFiles?.length > 0 && includeClientDirectory && (
            <div className="mt-2">
              <FolderHeader name="clientFiles/" />
              <div className="mt-1 flex flex-col gap-1 pl-6">
                {additionalFiles.map((file) => (
                  <FilePreview key={file.name} filename={file.name} />
                ))}
              </div>
            </div>
          )}

          {additionalFiles?.length > 0 && !includeClientDirectory && (
            <>
              {additionalFiles.map((file) => (
                <FilePreview key={file.name} filename={file.name} />
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
