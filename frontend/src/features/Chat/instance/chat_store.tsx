import { create } from "zustand";

import type { AssistantId } from "../constants/assistants";
import { type ChatModel, DEFAULT_CHAT_MODEL } from "../constants/models";

export type ChatState = {
  assistantId: AssistantId;
  model: ChatModel;
  externalMessage?: string | null;
};

export type ChatActions = {
  setAssistant: (agent: AssistantId) => void;
  setModel: (model: ChatModel) => void;
  setExternalMessage: (val: string | null) => void;
};

export type ChatStore = ChatState & ChatActions;

const initialChatState: ChatState = {
  assistantId: "agent_gestalt",
  model: DEFAULT_CHAT_MODEL,
};

export const useChatStore = create<ChatStore>()((set) => ({
  ...initialChatState,

  setAssistant: (assistant) =>
    set({
      assistantId: assistant,
    }),

  setModel: (model) =>
    set({
      model,
    }),

  setExternalMessage: (val) => set({ externalMessage: val }),
}));
