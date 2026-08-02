import type { CircuitDefinitionV1 } from "../QuestionEngine/render/components/content/circuitDefinition";

export type ParameterDefinition = {
  id: string;
  name: string;
  type: "integer" | "decimal";
  minimum: string;
  maximum: string;
  unit: string;
  decimalPlaces: number;
};

export type NumericAnswerDefinition = {
  id: string;
  name: string;
  formula: string;
  inputLabel: string;
  unit: string;
  significantDigits: number;
};

export type GuidedQuestionDraft = {
  title: string;
  questionBody: string;
  solutionBody: string;
  parameters: ParameterDefinition[];
  answers: NumericAnswerDefinition[];
  circuitEnabled: boolean;
  circuit: CircuitDefinitionV1;
};

export type GuidedArtifacts = Record<
  "question.html" | "solution.html" | "server.py" | "server.js",
  string
> & { "circuit.json"?: string };

