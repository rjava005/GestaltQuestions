import StructuredMathInput from "../math/StructuredMathInput";

export type PLMathInputProps = {
  answerName: string;
  label?: string;
  className?: string;
};

export default function PLMathInput(props: PLMathInputProps) {
  return <StructuredMathInput {...props} />;
}
