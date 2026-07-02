import { type AssistantId, ASSISTANTS } from "../constants/assistants";
import { CHAT_MODELS, type ChatModel } from "../constants/models";
import { useChatStore } from "../instance";

function AssistantConfig() {
  const assistantId = useChatStore((s) => s.assistantId);
  const setAssistant = useChatStore((s) => s.setAssistant);

  const selectedAssistant = ASSISTANTS.find(
    (assistant) => assistant.assistant_id === assistantId,
  );

  return (
    <div className="space-y-2 ">
      <label
        htmlFor="assistant-select"
        className="block text-sm font-medium text-text"
      >
        Assistant
      </label>
      <select
        id="assistant-select"
        value={assistantId}
        onChange={(event) => setAssistant(event.target.value as AssistantId)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text"
      >
        {ASSISTANTS.map((assistant) => (
          assistant.active?
          (<option key={assistant.assistant_id} value={assistant.assistant_id}>
            {assistant.label}
          </option>):null
        ))}
      </select>
      {selectedAssistant ? (
        <p className="text-sm text-text-muted">
          {selectedAssistant.description}
        </p>
      ) : null}
    </div>
  );
}

function ModelConfig() {
  const model = useChatStore((s) => s.model);
  const setModel = useChatStore((s) => s.setModel);

  

  return (
    <div className="space-y-2">
      <label
        htmlFor="model-select"
        className="block text-sm font-medium text-text"
      >
        Model
      </label>
      <select
        id="model-select"
        value={model}
        onChange={(event) => setModel(event.target.value as ChatModel)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text"
      >
        {CHAT_MODELS.map((chatModel) => (
          chatModel.active ?
            (<option key={chatModel.value} value={chatModel.value}>
              {chatModel.label}
            </option>) : null
        ))}
      </select>
    </div>
  );
}

export default function ChatConfig() {
  return (
    <div className="flex flex-col w-8/10 items-start justify-center mx-auto gap-3">
      <ModelConfig />
      <AssistantConfig />
    </div>
  );
}
