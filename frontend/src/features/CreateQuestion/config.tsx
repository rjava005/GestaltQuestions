import type { QuestionFileSpec,CreateMode } from "./types";

const QUESTION_FILE_SPECS: QuestionFileSpec[] = [
  {
    filename: "question.html",
    required: true,
    isAdaptive: false,
    description: "Defines the question content and user inputs.",
    template: [
      // ───────────── Adaptive Version ─────────────
      {
        adaptive: true,
        template: `
<pl-question-panel>
  <p>
    What is the sum of {{params.a}} and {{params.b}}?
  </p>
</pl-question-panel>

<pl-number-input
  answers-name="sum"
  label="Sum"
/>
        `.trim(),
      },

      // ───────────── Non-Adaptive Version ─────────────
      {
        adaptive: false,
        template: `
<pl-question-panel>
  <p>
    What is 2 + 3?
  </p>
</pl-question-panel>

<pl-multiple-choice answers-name="sum">
  <pl-answer correct="false">4</pl-answer>
  <pl-answer correct="true">5</pl-answer>
  <pl-answer correct="false">6</pl-answer>
</pl-multiple-choice>
        `.trim(),
      },
    ],
  },

  {
    filename: "solution.html",
    required: false,
    isAdaptive: false,
    description: "Provides an optional worked solution or explanation.",
    template: [
      // ───────────── Adaptive Version ─────────────
      {
        adaptive: true,
        template: `
<pl-solution-panel>
  <pl-hint level="1">
    Add the two given numbers.
  </pl-hint>

  <pl-hint level="2">
    {{params.a}} + {{params.b}} = {{correct_answers.sum}}
  </pl-hint>
</pl-solution-panel>
        `.trim(),
      },

      // ───────────── Non-Adaptive Version ─────────────
      {
        adaptive: false,
        template: `
<pl-solution-panel>
  <pl-hint level="1">
    The problem asks for the sum of 2 and 3.
  </pl-hint>

  <pl-hint level="2">
    2 + 3 = 5
  </pl-hint>
</pl-solution-panel>
        `.trim(),
      },
    ],
  },

  {
    filename: "server.js",
    required: false,
    isAdaptive: true,
    description: "Generates dynamic parameters for adaptive questions (JavaScript).",
    template: [
      {
        adaptive: true,
        template: `
const math = require("mathjs");

const generate = () => {
  const a = math.randomInt(1, 21);
  const b = math.randomInt(1, 21);

  return {
    params: { a, b },
    correct_answers: {
      sum: a + b,
    },
  };
};

module.exports = { generate };
        `.trim(),
      },
    ],
  },

  {
    filename: "server.py",
    required: false,
    isAdaptive: true,
    description: "Generates dynamic parameters for adaptive questions (Python).",
    template: [
      {
        adaptive: true,
        template: `
import random

def generate():
    a = random.randint(1, 20)
    b = random.randint(1, 20)

    return {
        "params": {
            "a": a,
            "b": b,
        },
        "correct_answers": {
            "sum": a + b,
        },
    }
        `.trim(),
      },
    ],
  },
];

export const CREATE_MODE_OPTIONS: {
  value: CreateMode;
  label: string;
  ariaLabel: string;
}[] = [
    {
      value: "blank",
      label: "Blank Template",
      ariaLabel: "Create a blank question template",
    },
    {
      value: "upload",
      label: "Upload Question",
      ariaLabel: "Upload an existing question",
    },
    {
      value: "text-ai",
      label: "AI (Text)",
      ariaLabel: "Generate a question using text-based AI",
    },
    {
      value: "image-ai",
      label: "AI (Image)",
      ariaLabel: "Generate a question from images using AI",
    },
  ];
export { QUESTION_FILE_SPECS };
