import type { FC } from "react";

import {
  PLAnswer,
  type PLAnswerProps,
  PLBlockDiagram,
  type PLBlockDiagramProps,
  PLCircuit,
  type PLCircuitProps,
  PLDerivation,
  type PLDerivationProps,
  PLDerivationStep,
  type PLDerivationStepProps,
  PLFigure,
  type PLFigureProps,
  PLHint,
  type PLHintProps,
  PLMathInput,
  type PLMathInputProps,
  PLMultipleChoice,
  type PLMultipleChoiceProps,
  PLNumberInput,
  type PLNumberInputProps,
  PLQuestionPanel,
  type PLQuestionPanelProps,
  PLSignalPlot,
  type PLSignalPlotProps,
  PLSolutionPanel,
  type PLSolutionPanelProps,
} from "../render/components";

// The currently available tags that are processed, this is the mapping
// These in html look like EX: <pl-question-panel>Hello world</pl-question-panel
export type ValidComponents =
  | "pl-question-panel"
  | "pl-number-input"
  | "pl-figure"
  | "pl-circuit"
  | "pl-signal-plot"
  | "pl-block-diagram"
  | "pl-math-input"
  | "pl-solution-panel"
  | "pl-hint"
  | "pl-derivation-container"
  | "pl-derivation-step"
  | "pl-multiple-choice"
  | "pl-checkbox"
  | "pl-answer";

export type TagRegistry = {
  "pl-question-panel": PLQuestionPanelProps;
  "pl-number-input": PLNumberInputProps;
  "pl-figure": PLFigureProps;
  "pl-circuit": PLCircuitProps;
  "pl-signal-plot": PLSignalPlotProps;
  "pl-block-diagram": PLBlockDiagramProps;
  "pl-math-input": PLMathInputProps;
  "pl-solution-panel": PLSolutionPanelProps;
  "pl-hint": PLHintProps;
  "pl-derivation-container": PLDerivationProps;
  "pl-derivation-step": PLDerivationStepProps;
  "pl-multiple-choice": PLMultipleChoiceProps;
  "pl-checkbox": PLMultipleChoiceProps;
  "pl-answer": PLAnswerProps;
};

export const ComponentMap: Record<
  ValidComponents | string,
  FC<any> | undefined
> = {
  "pl-question-panel": PLQuestionPanel,
  "pl-number-input": PLNumberInput,
  "pl-figure": PLFigure,
  "pl-circuit": PLCircuit,
  "pl-signal-plot": PLSignalPlot,
  "pl-block-diagram": PLBlockDiagram,
  "pl-math-input": PLMathInput,
  "pl-solution-panel": PLSolutionPanel,
  "pl-hint": PLHint,
  "pl-derivation-container": PLDerivation,
  "pl-derivation-step": PLDerivationStep,
  "pl-multiple-choice": PLMultipleChoice,
  "pl-checkbox": PLMultipleChoice,
  "pl-answer": PLAnswer,
};

// These are the raw attributes for instance <pl-number-input answer-name='c' />
type RawAttributes = Record<string, string>;

// This essentially maps the raw attributes and changes them and process them
// Into more react viable components, the raw attributes are a mapping to the react
// props that the input element expects,
export const TagAttributeMapping: {
  // eslint-disable-next-line no-unused-vars
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
    autoShowAll: Boolean(attrs["show-all"]),
    title: attrs["title"],
    subtitle: attrs["subtitle"],
  }),
  "pl-number-input": (attrs) => ({
    answerName: attrs["answers-name"],
    comparison: attrs["comparison"] ?? "exact",
    digits: Number(attrs["digits"] ?? 3),
    label: attrs["label"] ?? "",
    className: attrs["classname"] || attrs["class"],
    variant: attrs["variant"],
  }),
  "pl-figure": (attrs) => ({
    src: attrs["src"],
    filename: attrs["filename"] ?? attrs["file-name"],
    className: attrs["classname"] || attrs["class"],
    size: attrs["size"],
    variant: attrs["variant"],
    useClientFilesDir: attrs["legacy"] ? true : false,
  }),
  "pl-circuit": (attrs) => ({
    fileName: attrs["file-name"] ?? attrs["filename"] ?? "",
    className: attrs["classname"] || attrs["class"],
  }),
  "pl-signal-plot": (attrs) => ({
    fileName: attrs["file-name"] ?? attrs["filename"] ?? "",
    className: attrs["classname"] || attrs["class"],
  }),
  "pl-block-diagram": (attrs) => ({
    fileName: attrs["file-name"] ?? attrs["filename"] ?? "",
    className: attrs["classname"] || attrs["class"],
  }),
  "pl-math-input": (attrs) => ({
    answerName: attrs["answer-name"] ?? attrs["answers-name"] ?? "",
    label: attrs["label"],
    className: attrs["classname"] || attrs["class"],
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
    className: attrs["class"] || attrs["classname"],
    size: attrs["size"],
    variant: attrs["variant"],
  }),
  "pl-answer": (attrs) => ({
    correct: attrs["correct"] === "true" ? "true" : "false",
  }),
  "pl-multiple-choice": (attrs) => ({
    answersName: attrs["answers-name"],
    inline: attrs["inline"] === "true",
    style: attrs["style"],
    multiple: attrs["multiple"] === "true",
  }),
  "pl-checkbox": (attrs) => ({
    answersName: attrs["answers-name"],
    inline: attrs["inline"] === "true",
    style: attrs["style"],
    multiple: attrs["multiple"] === "true",
  }),
};
