import { useEffect, useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { Button } from "../../components/Button";
import { CodeEditor } from "../../components/CodeEditor";
import { QuestionHTMLToReact } from "../QuestionEngine";
import questionComponentDocsRaw from "../QuestionEngine/docs/questionComponentDocumentation.json?raw";
import { QuestionInstanceProvider } from "../QuestionEngine/instance";

type QuestionComponentAttribute = {
  htmlAttribute: string;
  prop: string;
  type: string;
  required: boolean;
  default?: string | number | boolean;
  allowedValues?: Array<string | number | boolean>;
  description: string;
};

type QuestionComponentDoc = {
  tag: string;
  componentName: string;
  summary: string;
  children: string;
  attributes: QuestionComponentAttribute[];
};

type QuestionComponentDocSchema = {
  version: string;
  feature: string;
  components: QuestionComponentDoc[];
};

const docs = JSON.parse(questionComponentDocsRaw) as QuestionComponentDocSchema;

const EXAMPLES_BY_TAG: Record<string, string> = {
  "pl-question-panel": `<pl-question-panel size="md" variant="default">\n  <p>Solve for $x$ where $2x + 4 = 14$.</p>\n</pl-question-panel>`,
  "pl-solution-panel": `<pl-solution-panel title="Solution">\n  <p>Subtract 4 on both sides: $2x=10$</p>\n  <p>Then divide by 2: $x=5$</p>\n</pl-solution-panel>`,
  "pl-number-input": `<pl-number-input answers-name="x" digits="2" label="$x$"></pl-number-input>`,
  "pl-hint": `<pl-hint level="1">Try isolating the variable first.</pl-hint>`,
  "pl-figure": `<pl-figure filename="diagram.png" size="md"></pl-figure>`,
  "pl-multiple-choice": `<pl-multiple-choice answers-name="q1">\n  <pl-answer correct="false">2</pl-answer>\n  <pl-answer correct="true">5</pl-answer>\n  <pl-answer correct="false">9</pl-answer>\n</pl-multiple-choice>`,
  "pl-checkbox": `<pl-checkbox answers-name="q2" multiple="true">\n  <pl-answer correct="true">Conservation of energy</pl-answer>\n  <pl-answer correct="false">Newton's 4th law</pl-answer>\n  <pl-answer correct="true">Momentum balance</pl-answer>\n</pl-checkbox>`,
  "pl-derivation-container": `<pl-derivation-container title="Derivation">\n  <pl-derivation-step>Start from $F=ma$</pl-derivation-step>\n  <pl-derivation-step>Integrate both sides over time.</pl-derivation-step>\n</pl-derivation-container>`,
  "pl-derivation-step": `<pl-derivation-container title="Single Step Context">\n  <pl-derivation-step>Substitute known values and simplify.</pl-derivation-step>\n</pl-derivation-container>`,
  "pl-answer": `<pl-multiple-choice answers-name="q1">\n  <pl-answer correct="true">Correct option</pl-answer>\n  <pl-answer correct="false">Distractor</pl-answer>\n</pl-multiple-choice>`,
};

function getExampleValue(attr: QuestionComponentAttribute): string {
  if (attr.allowedValues?.length) return String(attr.allowedValues[0]);
  if (attr.default !== undefined) return String(attr.default);
  if (attr.type.includes("boolean")) return "true";
  if (attr.type.includes("number")) return "1";
  if (attr.type.includes("string")) return "value";
  return "value";
}

function buildFallbackMarkup(component: QuestionComponentDoc): string {
  const requiredAttrs = component.attributes
    .filter((attr) => attr.required)
    .map(
      (attr) =>
        `${attr.htmlAttribute.split("|")[0]}="${getExampleValue(attr)}"`,
    );

  const attrs = requiredAttrs.length ? ` ${requiredAttrs.join(" ")}` : "";
  const hasChildren = component.children !== "None.";
  const inner = hasChildren ? `\n  ${component.children}\n` : "";

  return `<${component.tag}${attrs}>${inner}</${component.tag}>`;
}

function buildComponentMarkup(component: QuestionComponentDoc): string {
  return EXAMPLES_BY_TAG[component.tag] ?? buildFallbackMarkup(component);
}

export default function QuestionComponentPlayground() {
  const components = docs.components;
  const [selectedTag, setSelectedTag] = useState<string>(
    components[0]?.tag ?? "",
  );
  const [editorValue, setEditorValue] = useState("");

  const selectedComponent = useMemo(
    () => components.find((c) => c.tag === selectedTag) ?? components[0],
    [components, selectedTag],
  );

  useEffect(() => {
    if (!selectedComponent) return;
    setEditorValue(buildComponentMarkup(selectedComponent));
  }, [selectedComponent]);

  if (!selectedComponent) {
    return (
      <div className="rounded-md border border-border bg-surface p-4 text-text-muted">
        No question component documentation was found.
      </div>
    );
  }

  return (
    <QuestionInstanceProvider>
      <section className="space-y-4">
        <header className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold text-text">
            Question Component Playground
          </h2>
          <p className="text-sm text-text-muted">
            Explore and test QuestionRender tags in isolation without creating a
            full question.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label
              htmlFor="component-select"
              className="text-sm text-text-muted"
            >
              Component
            </label>
            <select
              id="component-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="rounded-md border border-border bg-surface-strong px-3 py-2 text-sm text-text"
            >
              {components.map((component) => (
                <option key={component.tag} value={component.tag}>
                  {component.componentName} ({component.tag})
                </option>
              ))}
            </select>

            <Button
              type="button"
              name="Reset Example"
              color="paneMuted"
              size="sm"
              onClick={() =>
                setEditorValue(buildComponentMarkup(selectedComponent))
              }
            />
          </div>
        </header>

        <div className="h-[70vh] overflow-hidden rounded-lg border border-border bg-surface">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={30} minSize={20} className="min-w-62.5">
              <div className="h-full overflow-auto border-r border-border p-4">
                <h3 className="text-base font-semibold text-text">
                  {selectedComponent.componentName}
                </h3>
                <p className="mt-1 text-xs font-mono text-text-soft">
                  {selectedComponent.tag}
                </p>
                <p className="mt-3 text-sm text-text-muted">
                  {selectedComponent.summary}
                </p>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-text">Children</h4>
                  <p className="text-sm text-text-muted">
                    {selectedComponent.children}
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-text">
                    Attributes
                  </h4>
                  <div className="mt-2 space-y-2">
                    {selectedComponent.attributes.map((attr) => (
                      <div
                        key={`${selectedComponent.tag}-${attr.prop}`}
                        className="rounded-md border border-border bg-surface-strong p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-text">
                            {attr.htmlAttribute}
                          </span>
                          <span
                            className={
                              attr.required
                                ? "rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300"
                                : "rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-soft"
                            }
                          >
                            {attr.required ? "required" : "optional"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-text-soft">
                          prop: {attr.prop} | type: {attr.type}
                        </div>
                        {attr.default !== undefined && (
                          <div className="mt-1 text-xs text-text-soft">
                            default: {String(attr.default)}
                          </div>
                        )}
                        {attr.allowedValues?.length ? (
                          <div className="mt-1 text-xs text-text-soft">
                            allowed: {attr.allowedValues.join(", ")}
                          </div>
                        ) : null}
                        <p className="mt-1 text-xs text-text-muted">
                          {attr.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-border hover:bg-border-strong transition-colors" />

            <Panel defaultSize={35} minSize={25}>
              <div className="h-full border-r border-border">
                <CodeEditor
                  value={editorValue}
                  setValue={setEditorValue}
                  language="html"
                />
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-border hover:bg-border-strong transition-colors" />

            <Panel defaultSize={35} minSize={25}>
              <div className="h-full overflow-auto bg-surface p-4">
                <div className="rounded-md border border-border bg-surface-strong p-4">
                  <QuestionHTMLToReact html={editorValue} />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </section>
    </QuestionInstanceProvider>
  );
}
