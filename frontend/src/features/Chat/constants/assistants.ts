export type Assistant = {
  assistant_id: string;
  label: string;
  description: string;
  active: boolean;
};
export const ASSISTANTS = [
  {
    assistant_id: "agent",
    label: "Default Assistant",
    description:
      "A general-purpose LLM with no specialized tools, instructions, or domain-specific behavior.",
    active: false,
  },
  {
    assistant_id: "core",
    label: "Core Assistant",
    description: "The core agent",
    active: false,
  },
  {
    assistant_id: "agent_gestalt",
    label: "Gestalt Agent",
    description:
      "Contains the core functionality for creating questions, including the specialized tools and workflow support needed for question authoring.",
    active: true,
  },

  {
    assistant_id: "agent_gestalt_module",
    label: "Gestalt Module",
    description: "Contains tools",
    active: false,
  },
] as const satisfies readonly Assistant[];

export type AssistantId = (typeof ASSISTANTS)[number]["assistant_id"];
