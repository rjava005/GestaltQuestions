import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { useStream } from "@langchain/react";
import { MathJax } from "better-react-mathjax";
import type { HITLResponse } from "langchain";
import { useCallback } from "react";

import { aiURL } from "../../config/apiConfig";
import { useAuth } from "../Auth";
import { AIBubble, HumanBubble } from "./components/ChatBubble";
import ChatContainer from "./components/ChatContainer";
import { ChatInput } from "./components/ChatInput";
import { ApprovalCard } from "./components/hitlApproval";
import RenderToolCalls from "./components/ToolCallRender";
import { useHITLReview } from "./hooks";
import { useThreadStore } from "./instance/store";
import { useChatStore } from "./instance/store";
import { prepareMessage } from "./utils";

export function ChatSession() {
  // User
  const { user } = useAuth();
  // Thread management
  const createThread = useThreadStore((state) => state.createThread);
  const threadId = useThreadStore((s) => s.threadId);
  // Chat Context
  const assistantId = useChatStore((s) => s.assistantId);
  const model = useChatStore((s) => s.model);

  const stream = useStream({
    threadId: threadId || null,
    apiUrl: aiURL,
    assistantId: assistantId,
    apiKey: import.meta.env.VITE_LANGSMITH_API_KEY,
    onThreadId: async (id: string) => {
      await createThread(id, await user?.getIdToken());
    },
  });

  const { messages, interrupt } = stream;

  const submitHITLResume = useCallback(
    (resume: HITLResponse) => {
      return stream.submit(null, { command: { resume } });
    },
    [stream],
  );
  const {
    hitlRequest,
    actionRequests,
    reviewConfigs,
    isProcessing,
    handleApprove,
    handleReject,
    handleEdit,
  } = useHITLReview({
    interruptValue: interrupt?.value,
    submitResume: submitHITLResume,
  });

  const handleSubmit = async (text: string, images?: string[]) => {
    const content = await prepareMessage(text, images);
    stream.submit(
      {
        messages: [
          {
            role: "human",
            content,
          },
        ],
      },
      {
        context: {
          model: model,
        },
      },
    );
  };

  return (
    <ChatContainer
      size="lg"
      scrollTrigger={stream.messages.length}
      input={
        <ChatInput
          handleSubmit={handleSubmit}
          disabled={stream.isLoading}
          multiModal={true}
        />
      }
    >
      <MathJax dynamic>
        {messages.map((msg) => {
          // console.log("MSG",msg, )
          if (msg.type === "human") {
            return <HumanBubble key={msg.id} msg={msg as HumanMessage} />;
          }
          if (msg.type === "ai") {
            return <AIBubble key={msg.id} msg={msg as AIMessage}></AIBubble>;
          }
          if (msg.type === "tool") {
            return <RenderToolCalls key={msg.id} msg={msg} />;
          }

          return null;
        })}

        {/* Handle the hitl request */}
        {hitlRequest && actionRequests.length > 0 && !isProcessing && (
          <div className="">
            {actionRequests.map((actionRequest, idx) => (
              <ApprovalCard
                key={idx}
                actionRequest={actionRequest}
                reviewConfig={reviewConfigs[idx]}
                onApprove={() => handleApprove(idx)}
                onReject={(reason) => handleReject(idx, reason)}
                onEdit={(editedArgs) => handleEdit(idx, editedArgs)}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )}
      </MathJax>
    </ChatContainer>
  );
}
