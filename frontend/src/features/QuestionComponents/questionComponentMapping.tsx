import PLQuestionPanel from "./PLQuestionPanel";
import PLNumberInput from "./PLNumberInput";
import PLFigure from "./PLFigure";
import type { PLFigureProps } from "./PLFigure";
import type { PLQuestionPanelProps } from "./PLQuestionPanel";
import type { PLNumberInputProps } from "./PLNumberInput";
import PLSolutionPanel from "./PLSolutionPanel";
import type { PLSolutionPanelProps } from "./PLSolutionPanel";
import PLHint from "./PLHint";
import type { PLHintProps } from "./PLHint";
import type { PLDerivationProps } from "./PLDerivationContainer";
import type { PLDerivationStepProps } from "./PLDerivationStep";
import { PLDerivation } from "./PLDerivationContainer";
import { PLDerivationStep } from "./PLDerivationStep";
import PLMultipleChoice, { PLAnswer, type PLAnswerProps, type PLMultipleChoiceProps } from './PLMultipleChoice';

// The currently available tags that are processed, this is the mapping
// These in html look like EX: <pl-question-panel>Hello world</pl-question-panel
export type ValidComponents =
  | "pl-question-panel"
  | "pl-number-input"
  | "pl-figure"
  | "pl-solution-panel"
  | "pl-hint"
  | "pl-derivation-container"
  | "pl-derivation-step";

export type TagRegistry = {
  "pl-question-panel": PLQuestionPanelProps;
  "pl-number-input": PLNumberInputProps;
  "pl-figure": PLFigureProps;
  "pl-solution-panel": PLSolutionPanelProps;
  "pl-hint": PLHintProps;
  "pl-derivation-container": PLDerivationProps;
  "pl-derivation-step": PLDerivationStepProps;
  "pl-multiple-choice": PLMultipleChoiceProps;
  "pl-checkbox": PLMultipleChoiceProps;
  "pl-answer": PLAnswerProps
};

export const ComponentMap: Record<
  ValidComponents | string,
  React.FC<any> | undefined
> = {
  "pl-question-panel": PLQuestionPanel,
  "pl-number-input": PLNumberInput,
  "pl-figure": PLFigure,
  "pl-solution-panel": PLSolutionPanel,
  "pl-hint": PLHint,
  "pl-derivation-container": PLDerivation,
  "pl-derivation-step": PLDerivationStep,
  "pl-multiple-choice": PLMultipleChoice,
  "pl-checkbox": PLMultipleChoice,
  "pl-answer": PLAnswer
};
// These are the raw attributes for instance <pl-number-input answer-name='c' />
type RawAttributes = Record<string, string>;

// This essentially maps the raw attributes and changes them and process them
// Into more react viable components, the raw attributes are a mapping to the react
// props that the input element expects,
export const TagAttributeMapping: {
  [K in keyof TagRegistry]: (attrs: RawAttributes) => TagRegistry[K];
} = {
  "pl-question-panel": (attrs) => ({
    className: attrs["classname"] || attrs["class"],
    size: attrs["size"],
    variant: attrs["variant"],
  }),
  "pl-solution-panel": (attrs) => ({
    className: attrs["classname"] || attrs["class"],
    size: attrs["size"],
    variant: attrs["variant"],
    autoShowAll: attrs["show-all"] ? true : false,
    title: attrs["title"],
    subtitle: attrs["subtitle"],
  }),

  "pl-number-input": (attrs) => ({
    answerName: attrs["answers-name"],
    comparison: attrs.comparison ?? "exact",
    digits: Number(attrs.digits ?? 3),
    label: attrs.label ?? "",
    className: attrs["classname"] || attrs["class"],
    variant: attrs["variant"],
  }),
  "pl-figure": (attrs) => ({
    src: attrs["file-name"],
    className: attrs["classname"] || attrs["class"],
    size: attrs["size"],
    variant: attrs["variant"],
  }),
  "pl-hint": (attrs) => ({
    level: attrs["level"],
    variant: attrs["variant"],
    className: attrs["classname"] || attrs["class"],
  }),
  "pl-derivation-step": (attrs) => ({
    className: attrs["class"] || attrs["classname"],
  }),
  "pl-derivation-container": (attrs) => ({
    title: attrs["title"],
    subtitle: attrs["subtitle"],
    reference: attrs["reference"],
    className: attrs["class"],
    size: attrs["size"],
    variant: attrs["variant"]
  }),
  "pl-answer": (attrs) => ({
    "correct": attrs["correct"] === "true" ? "true" : "false"
  }),
  "pl-multiple-choice": (attrs) => ({
    "answersName": attrs["answers-name"],
    "inline": attrs["inline"] === "true" ? true : false,
    "style": attrs["style"],
    "multiple": attrs["multiple"] === "true" ? true : false
  }),
  "pl-checkbox": (attrs) => ({
    "answersName": attrs["answers-name"],
    "inline": attrs["inline"] === "true" ? true : false,
    "style": attrs["style"],
    "multiple": attrs["multiple"] === "true" ? true : false
  }),
};


