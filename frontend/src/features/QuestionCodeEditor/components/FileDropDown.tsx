import { DropDown } from "../../../components/DropDown";
import type { FileData } from "../../../types/fileTypes";

type FileDropDownProps = {
  files: FileData[];
  activeFile: FileData;
  setActive: (file: FileData) => void;
};

export default function FileDropDown({
  files,
  activeFile,
  setActive,
}: FileDropDownProps) {
  const handleSelect = (val: string) => {
    const nextFile = files.find((v) => v.filename === val) ?? files[0];
    setActive(nextFile);
  };
  return (
    <div className="min-w-55 flex-1">
      <DropDown
        label="Question Files"
        options={files.map((f) => f.filename)}
        selected={activeFile.filename}
        setSelected={handleSelect}
      />
    </div>
  );
}
