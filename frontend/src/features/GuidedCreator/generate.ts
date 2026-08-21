import { emitFormula, formulaReferences, parseFormula } from "./formula";
import type { GuidedArtifacts, GuidedQuestionDraft } from "./types";
import { validateCircuitDefinition } from "../QuestionEngine/render/components/content/circuitDefinition";
import { validateBlockDiagramDefinition } from "../QuestionEngine/render/components/visuals/blockDiagramDefinition";

export const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
export const MAX_DECIMAL_PLACES = 8;

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export function markdownToSafeHtml(markdown: string): string {
  const inline = (line: string) => line
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  const output: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) output.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const line of escapeHtml(markdown.replaceAll("\r\n", "\n")).split("\n")) {
    if (/^\s*[-*]\s+/.test(line)) { list.push(line.replace(/^\s*[-*]\s+/, "")); continue; }
    flush();
    if (!line.trim()) continue;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    output.push(heading ? `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>` : `<p>${inline(line)}</p>`);
  }
  flush();
  return output.join("\n");
}

function duplicates(rows: Array<{ name: string }>) {
  const counts = new Map<string, number>();
  rows.forEach(({ name }) => counts.set(name.trim(), (counts.get(name.trim()) ?? 0) + 1));
  return [...counts].filter(([name, count]) => name && count > 1).map(([name]) => name);
}

function placeholderErrors(body: string, params: Set<string>, answers: Set<string>, solution: boolean) {
  const errors: string[] = [];
  for (const match of body.matchAll(/{{\s*([^{}]+?)\s*}}/g)) {
    const parsed = /^(params|correct_answers)\.([A-Za-z_][A-Za-z0-9_]*)$/.exec(match[1]);
    if (!parsed) errors.push(`Unknown placeholder {{${match[1]}}}.`);
    else if (parsed[1] === "params" && !params.has(parsed[2])) errors.push(`Placeholder references unknown parameter "${parsed[2]}".`);
    else if (parsed[1] === "correct_answers" && (!solution || !answers.has(parsed[2]))) errors.push(`Placeholder references unavailable answer "${parsed[2]}".`);
  }
  return errors;
}

export function validateGuidedDraft(draft: GuidedQuestionDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push("Title is required.");
  if (!draft.questionBody.trim()) errors.push("Question body is required.");
  if (!draft.solutionBody.trim()) errors.push("Solution body is required.");
  if (!draft.answers.length) errors.push("Add at least one numeric answer.");
  const params = new Set(draft.parameters.map((row) => row.name.trim()).filter(Boolean));
  const answers = new Set(draft.answers.map((row) => row.name.trim()).filter(Boolean));
  duplicates(draft.parameters).forEach((name) => errors.push(`Parameter name "${name}" is duplicated.`));
  duplicates(draft.answers).forEach((name) => errors.push(`Answer name "${name}" is duplicated.`));
  for (const row of draft.parameters) {
    const name = row.name.trim();
    const min = Number(row.minimum), max = Number(row.maximum);
    if (!IDENTIFIER_PATTERN.test(name)) errors.push(`Parameter name "${name || "(blank)"}" is not a valid identifier.`);
    if (!Number.isFinite(min) || !Number.isFinite(max)) errors.push(`Parameter "${name}" must have finite bounds.`);
    else if (min > max) errors.push(`Parameter "${name}" minimum cannot exceed its maximum.`);
    if (row.type === "integer" && (!Number.isInteger(min) || !Number.isInteger(max))) errors.push(`Integer parameter "${name}" requires integral bounds.`);
    if (row.type === "decimal" && (!Number.isInteger(row.decimalPlaces) || row.decimalPlaces < 0 || row.decimalPlaces > MAX_DECIMAL_PLACES)) errors.push(`Decimal parameter "${name}" must use 0-${MAX_DECIMAL_PLACES} decimal places.`);
  }
  for (const row of draft.answers) {
    const name = row.name.trim();
    if (!IDENTIFIER_PATTERN.test(name)) errors.push(`Answer name "${name || "(blank)"}" is not a valid identifier.`);
    if (!row.inputLabel.trim()) errors.push(`Answer "${name}" needs an input label.`);
    if (!Number.isInteger(row.significantDigits) || row.significantDigits < 1 || row.significantDigits > 12) errors.push(`Answer "${name}" must use 1-12 significant digits.`);
    try {
      for (const ref of formulaReferences(parseFormula(row.formula))) if (!params.has(ref)) errors.push(`Formula for "${name}" references unknown parameter "${ref}".`);
    } catch (error) { errors.push(`Formula for "${name}": ${error instanceof Error ? error.message : String(error)}`); }
  }
  errors.push(...placeholderErrors(draft.questionBody, params, answers, false));
  errors.push(...placeholderErrors(draft.solutionBody, params, answers, true));
  if (draft.circuitEnabled) {
    try { validateCircuitDefinition(draft.circuit); } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
    if (!draft.circuit.wires.length && !draft.circuit.elements.length && !draft.circuit.annotations?.length) errors.push("Circuit cannot be empty.");
    for (const element of draft.circuit.elements) {
      if ("from" in element && element.from[0] === element.to[0] && element.from[1] === element.to[1]) errors.push(`Circuit element "${element.id}" has zero length.`);
      const bindings = element.value ? ("path" in element.value ? [element.value] : Object.values(element.value.bindings)) : [];
      bindings.forEach(({ path }) => { if (!params.has(path)) errors.push(`Circuit element "${element.id}" references missing parameter "${path}".`); });
    }
  }
  if (draft.blockDiagramEnabled) {
    try { validateBlockDiagramDefinition(draft.blockDiagram); } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
    if (!draft.blockDiagram.nodes.length && !draft.blockDiagram.wires.length) errors.push("Block diagram cannot be empty.");
    for (const node of draft.blockDiagram.nodes) {
      const bindings = node.value ? ("path" in node.value ? [node.value] : Object.values(node.value.bindings)) : [];
      bindings.forEach(({ path }) => { if (!params.has(path)) errors.push(`Block "${node.id}" references missing parameter "${path}".`); });
    }
    const answerNames = new Set(draft.answers.map((row) => row.name.trim()));
    for (const slot of draft.blockDiagram.answerSlots ?? []) {
      if (!slot.answerName.trim()) errors.push(`Answer slot "${slot.id}" needs an answer name.`);
      else if (!answerNames.has(slot.answerName.trim())) errors.push(`Answer slot "${slot.answerName}" has no matching numeric answer.`);
    }
  }
  return [...new Set(errors)];
}

function pythonRuntime(draft: GuidedQuestionDraft) {
  const lines = ["import math", "import random", "", "", "def generate(use_predefined_values=0, overrides=None):", "    overrides = overrides or {}", "    params = {}"];
  for (const row of draft.parameters) {
    const name = row.name.trim(), min = Number(row.minimum), max = Number(row.maximum);
    lines.push(row.type === "integer"
      ? `    ${name} = overrides.get(${JSON.stringify(name)}, random.randint(${min}, ${max}))`
      : `    ${name} = overrides.get(${JSON.stringify(name)}, round(random.uniform(${min}, ${max}), ${row.decimalPlaces}))`);
    lines.push(`    params[${JSON.stringify(name)}] = ${name}`);
  }
  lines.push("    correct_answers = {");
  draft.answers.forEach((row) => lines.push(`        ${JSON.stringify(row.name.trim())}: ${emitFormula(parseFormula(row.formula), "python")},`));
  const digits = Math.max(...draft.answers.map((row) => row.significantDigits));
  lines.push("    }", "    return {", '        "params": params,', '        "correct_answers": correct_answers,', `        "nDigits": ${digits},`, `        "sigfigs": ${digits},`, "    }", "");
  return lines.join("\n");
}

function javascriptRuntime(draft: GuidedQuestionDraft) {
  const lines = ["const generate = (usePredefinedValues = false, overrides = {}) => {", "  const params = {};"];
  for (const row of draft.parameters) {
    const name = row.name.trim(), min = Number(row.minimum), max = Number(row.maximum);
    if (row.type === "integer") lines.push(`  const ${name} = overrides[${JSON.stringify(name)}] ?? Math.floor(Math.random() * (${max} - ${min} + 1)) + ${min};`);
    else {
      const scale = 10 ** row.decimalPlaces;
      lines.push(`  const ${name} = overrides[${JSON.stringify(name)}] ?? Math.round((Math.random() * (${max} - ${min}) + ${min}) * ${scale}) / ${scale};`);
    }
    lines.push(`  params[${JSON.stringify(name)}] = ${name};`);
  }
  lines.push("  const correct_answers = {");
  draft.answers.forEach((row) => lines.push(`    ${JSON.stringify(row.name.trim())}: ${emitFormula(parseFormula(row.formula), "javascript")},`));
  const digits = Math.max(...draft.answers.map((row) => row.significantDigits));
  lines.push("  };", "  return {", "    params,", "    correct_answers,", `    nDigits: ${digits},`, `    sigfigs: ${digits},`, "  };", "};", "", "module.exports = { generate };", "");
  return lines.join("\n");
}

export function generateGuidedArtifacts(draft: GuidedQuestionDraft): GuidedArtifacts {
  const errors = validateGuidedDraft(draft);
  if (errors.length) throw new Error(errors.join("\n"));
  const inputs = draft.answers.map((row) => {
    const label = row.unit.trim() ? `${row.inputLabel.trim()} (${row.unit.trim()})` : row.inputLabel.trim();
    return `<pl-number-input answers-name="${escapeHtml(row.name.trim())}" comparison="sigfig" digits="${row.significantDigits}" label="${escapeHtml(label)}"></pl-number-input>`;
  });
  const circuit = draft.circuitEnabled ? '\n<pl-circuit file-name="circuit.json"></pl-circuit>' : "";
  const blockDiagram = draft.blockDiagramEnabled ? '\n<pl-block-diagram file-name="block-diagram.json"></pl-block-diagram>' : "";
  // Answer slots live inside the diagram, so drop the standalone number inputs they duplicate.
  const slotAnswers = new Set(draft.blockDiagramEnabled ? (draft.blockDiagram.answerSlots ?? []).map((slot) => slot.answerName.trim()) : []);
  const standaloneInputs = inputs.filter((_, index) => !slotAnswers.has(draft.answers[index].name.trim()));
  const artifacts: GuidedArtifacts = {
    "question.html": `<pl-question-panel>\n${markdownToSafeHtml(draft.questionBody)}\n</pl-question-panel>${circuit}${blockDiagram}\n\n${standaloneInputs.join("\n")}`,
    "solution.html": `<pl-solution-panel>\n${markdownToSafeHtml(draft.solutionBody)}\n</pl-solution-panel>`,
    "server.py": pythonRuntime(draft),
    "server.js": javascriptRuntime(draft),
  };
  if (draft.circuitEnabled) artifacts["circuit.json"] = JSON.stringify(draft.circuit, null, 2);
  if (draft.blockDiagramEnabled) artifacts["block-diagram.json"] = JSON.stringify(draft.blockDiagram, null, 2);
  return artifacts;
}
