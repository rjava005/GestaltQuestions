import { X } from "lucide-react";
import type { Dispatch } from "react";
import { useState } from "react";

import { parseTopicInput } from "../utils";

type TopicsSectionProps = {
  topics: string[];
  onTopicsChange: Dispatch<string[]>;
};

export function TopicsSection({ topics, onTopicsChange }: TopicsSectionProps) {
  const [draftTopic, setDraftTopic] = useState("");

  const addTopics = (rawValue: string) => {
    const nextTopics = parseTopicInput(rawValue);
    if (!nextTopics.length) return;

    onTopicsChange(
      Array.from(new Set([...topics, ...nextTopics])).sort((a, b) =>
        a.localeCompare(b),
      ),
    );
    setDraftTopic("");
  };

  const removeTopic = (topicToRemove: string) => {
    onTopicsChange(topics.filter((topic) => topic !== topicToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-text-muted">
        <label htmlFor="question-metadata-topics">Topics</label>
        <span className="text-red-400">*</span>
      </div>

      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-border bg-bg px-2 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
        {topics.map((topic) => (
          <span
            key={topic}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-strong px-2.5 py-1.5 text-sm text-text"
          >
            {topic}
            <button
              type="button"
              aria-label={`Remove ${topic}`}
              onClick={() => removeTopic(topic)}
              className="text-text-muted hover:text-text"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}

        <input
          id="question-metadata-topics"
          value={draftTopic}
          onChange={(event) => setDraftTopic(event.target.value)}
          onBlur={() => addTopics(draftTopic)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTopics(draftTopic);
            }
          }}
          placeholder={topics.length ? "Add another topic" : "Add topics"}
          className="min-w-40 flex-1 bg-transparent px-1 py-1.5 text-sm text-text outline-none placeholder:text-text-muted"
        />
      </div>

      <p className="text-sm text-text-muted">
        Add relevant topics that best describe this question.
      </p>
    </div>
  );
}
