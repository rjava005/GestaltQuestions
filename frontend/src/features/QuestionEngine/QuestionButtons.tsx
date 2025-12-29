
import type { FormEvent } from "react";
import { MyButton } from "../../components/Button/Button";

type QuestionButtonProps = {
  isSubmitted: boolean;
  showSolution: () => void;
  handleSubmit: (e: FormEvent) => void;
  generateVariant: () => void;
};
export function QuestionButtons({
  isSubmitted,
  showSolution,
  handleSubmit,
  generateVariant,
}: QuestionButtonProps) {
  return (
    <div className="grid sm:grid-cols-3 gap-10 mb-10">
      <MyButton
        name={"Generate Variation"}
        onClick={generateVariant}
        color="generateVariant"
      />
      <MyButton name={"Show Solution"} color="showSolution" onClick={showSolution} />
      <MyButton
        name={"Submit"}
        type="submit"
        onClick={handleSubmit}
        disabled={isSubmitted}
        color="submitQuestion"
      />
    </div>
  );
}
