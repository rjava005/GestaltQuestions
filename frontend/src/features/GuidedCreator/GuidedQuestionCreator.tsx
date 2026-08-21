import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCreateQuestion } from "../QuestionBuilder/hooks";
import BlockDiagramEditor, { EMPTY_BLOCK_DIAGRAM } from "./BlockDiagramEditor";
import CircuitEditor, { EMPTY_CIRCUIT } from "./CircuitEditor";
import { generateGuidedArtifacts, validateGuidedDraft } from "./generate";
import type { GuidedQuestionDraft, NumericAnswerDefinition, ParameterDefinition } from "./types";

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const newParameter = (): ParameterDefinition => ({ id: uid(), name: "", type: "integer", minimum: "1", maximum: "10", unit: "", decimalPlaces: 2 });
const newAnswer = (): NumericAnswerDefinition => ({ id: uid(), name: "answer", formula: "0", inputLabel: "Answer", unit: "", significantDigits: 3 });
const inputClass = "mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2";

export default function GuidedQuestionCreator() {
  const navigate = useNavigate();
  const { createQuestion, loading, error: requestError } = useCreateQuestion();
  const [showErrors, setShowErrors] = useState(false);
  const [draft, setDraft] = useState<GuidedQuestionDraft>({
    title: "", questionBody: "", solutionBody: "", parameters: [], answers: [newAnswer()], circuitEnabled: false,
    circuit: { ...EMPTY_CIRCUIT, wires: [], elements: [], annotations: [] },
    blockDiagramEnabled: false, blockDiagram: { ...EMPTY_BLOCK_DIAGRAM, nodes: [], wires: [], answerSlots: [] },
  });
  const errors = useMemo(() => validateGuidedDraft(draft), [draft]);
  const patchParameter = (id: string, patch: Partial<ParameterDefinition>) => setDraft((value) => ({ ...value, parameters: value.parameters.map((row) => row.id === id ? { ...row, ...patch } : row) }));
  const patchAnswer = (id: string, patch: Partial<NumericAnswerDefinition>) => setDraft((value) => ({ ...value, answers: value.answers.map((row) => row.id === id ? { ...row, ...patch } : row) }));

  const save = async () => {
    setShowErrors(true);
    if (errors.length) return;
    try {
      const artifacts = generateGuidedArtifacts(draft);
      const files = Object.entries(artifacts).map(([name, content]) => new File([content], name, { type: name.endsWith(".json") ? "application/json" : "text/plain" }));
      const created = await createQuestion({ title: draft.title.trim(), ai_generated: false, isAdaptive: draft.parameters.length > 0, qType: ["num"], topics: [] }, files);
      if (created) navigate(`/question_builder/questions/${created.id}/edit`);
    } catch { /* hook exposes the request error */ }
  };

  return <div className="mx-auto max-w-6xl space-y-6 pb-20">
    <header className="sticky top-0 z-20 flex items-center justify-between rounded-xl border border-border bg-surface/95 px-5 py-4 backdrop-blur">
      <div><p className="text-sm text-text-muted">Guided numerical authoring</p><h1 className="text-2xl font-bold">Create question</h1></div>
      <button type="button" onClick={save} disabled={loading} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50">{loading ? "Saving…" : "Save"}</button>
    </header>
    {showErrors && errors.length ? <div role="alert" className="rounded-xl border border-red-500 bg-red-50 p-4 text-red-800"><p className="font-semibold">Fix these items before saving:</p><ul className="mt-2 list-disc pl-5">{errors.map((message) => <li key={message}>{message}</li>)}</ul></div> : null}
    {requestError ? <div role="alert" className="rounded-xl border border-red-500 p-4 text-red-700">{requestError}</div> : null}

    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">Question content</h2>
      <label className="block text-sm">Title *<input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
      <label className="block text-sm">Question body (Markdown, LaTeX, and {"{{params.name}}"}) *<textarea className={`${inputClass} min-h-36 font-mono`} value={draft.questionBody} onChange={(event) => setDraft({ ...draft, questionBody: event.target.value })} /></label>
      <label className="block text-sm">Solution (also {"{{correct_answers.name}}"}) *<textarea className={`${inputClass} min-h-32 font-mono`} value={draft.solutionBody} onChange={(event) => setDraft({ ...draft, solutionBody: event.target.value })} /></label>
    </section>

    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex justify-between gap-4"><div><h2 className="text-lg font-semibold">Parameters</h2><p className="text-sm text-text-muted">Integer ranges are inclusive. Decimal values are rounded.</p></div><button type="button" onClick={() => setDraft({ ...draft, parameters: [...draft.parameters, newParameter()] })} className="rounded-lg bg-surface-muted px-3 py-2">+ Parameter</button></div>
      {draft.parameters.map((row) => <div key={row.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-7">
        <label className="text-xs md:col-span-2">Name<input aria-label="Parameter name" className={inputClass} value={row.name} onChange={(event) => patchParameter(row.id, { name: event.target.value })} /></label>
        <label className="text-xs">Type<select aria-label="Parameter type" className={inputClass} value={row.type} onChange={(event) => patchParameter(row.id, { type: event.target.value as ParameterDefinition["type"] })}><option value="integer">Integer</option><option value="decimal">Decimal</option></select></label>
        <label className="text-xs">Minimum<input aria-label="Parameter minimum" type="number" className={inputClass} value={row.minimum} onChange={(event) => patchParameter(row.id, { minimum: event.target.value })} /></label>
        <label className="text-xs">Maximum<input aria-label="Parameter maximum" type="number" className={inputClass} value={row.maximum} onChange={(event) => patchParameter(row.id, { maximum: event.target.value })} /></label>
        <label className="text-xs">Unit<input aria-label="Parameter unit" className={inputClass} value={row.unit} onChange={(event) => patchParameter(row.id, { unit: event.target.value })} /></label>
        <div className="flex items-end gap-2">{row.type === "decimal" ? <label className="text-xs">Places<input aria-label="Decimal places" type="number" min={0} max={8} className={inputClass} value={row.decimalPlaces} onChange={(event) => patchParameter(row.id, { decimalPlaces: Number(event.target.value) })} /></label> : null}<button type="button" onClick={() => setDraft({ ...draft, parameters: draft.parameters.filter((item) => item.id !== row.id) })} className="rounded bg-red-700 px-2 py-2 text-white">Remove</button></div>
      </div>)}
      {!draft.parameters.length ? <p className="rounded-lg bg-surface-muted p-3 text-sm">No parameters. Constant formulas create a non-adaptive question.</p> : null}
    </section>

    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex justify-between gap-4"><div><h2 className="text-lg font-semibold">Numeric answers</h2><p className="text-sm text-text-muted">Allowed: +, −, *, /, ^, pi, e, sqrt, abs, exp, log, sin, cos, tan.</p></div><button type="button" onClick={() => setDraft({ ...draft, answers: [...draft.answers, newAnswer()] })} className="rounded-lg bg-surface-muted px-3 py-2">+ Answer</button></div>
      {draft.answers.map((row) => <div key={row.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-6">
        <label className="text-xs">Name<input aria-label="Answer name" className={inputClass} value={row.name} onChange={(event) => patchAnswer(row.id, { name: event.target.value })} /></label>
        <label className="text-xs md:col-span-2">Formula<input aria-label="Answer formula" className={`${inputClass} font-mono`} value={row.formula} onChange={(event) => patchAnswer(row.id, { formula: event.target.value })} /></label>
        <label className="text-xs">Input label<input aria-label="Answer input label" className={inputClass} value={row.inputLabel} onChange={(event) => patchAnswer(row.id, { inputLabel: event.target.value })} /></label>
        <label className="text-xs">Unit<input aria-label="Answer unit" className={inputClass} value={row.unit} onChange={(event) => patchAnswer(row.id, { unit: event.target.value })} /></label>
        <div className="flex items-end gap-2"><label className="text-xs">Sig. digits<input aria-label="Significant digits" type="number" min={1} max={12} className={inputClass} value={row.significantDigits} onChange={(event) => patchAnswer(row.id, { significantDigits: Number(event.target.value) })} /></label><button type="button" onClick={() => setDraft({ ...draft, answers: draft.answers.filter((item) => item.id !== row.id) })} className="rounded bg-red-700 px-2 py-2 text-white">Remove</button></div>
      </div>)}
    </section>

    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <label className="flex items-center gap-3 text-lg font-semibold"><input type="checkbox" checked={draft.circuitEnabled} onChange={(event) => setDraft({ ...draft, circuitEnabled: event.target.checked })} /> Include a circuit</label>
      {draft.circuitEnabled ? <CircuitEditor scene={draft.circuit} parameters={draft.parameters} onChange={(circuit) => setDraft((value) => ({ ...value, circuit }))} /> : <p className="text-sm text-text-muted">Enable to author and export a native circuit.json scene.</p>}
    </section>

    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <label className="flex items-center gap-3 text-lg font-semibold"><input type="checkbox" checked={draft.blockDiagramEnabled} onChange={(event) => setDraft({ ...draft, blockDiagramEnabled: event.target.checked })} /> Include a block diagram</label>
      {draft.blockDiagramEnabled ? <BlockDiagramEditor definition={draft.blockDiagram} parameters={draft.parameters} onChange={(blockDiagram) => setDraft((value) => ({ ...value, blockDiagram }))} /> : <p className="text-sm text-text-muted">Enable to author and export a native block-diagram.json scene.</p>}
    </section>
  </div>;
}
