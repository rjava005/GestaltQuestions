import ChatContainer from "./components/ChatContainer";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { HumanBubble, AIBubble } from "./components/ChatBubble";
import { ChatInput } from "./components/ChatInput";
import { useStream } from "@langchain/react";
import RenderToolCalls from "./components/ToolCallRender";
import { useChatContext } from "./instance/context";
import { useAuth } from "../Auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import SideBar from "../../components/SideBar/SideBar";
import { blobURLtoBase64 } from "./utils/imageUtils";
import type { ThreadRead } from "./ChatApi";
import { GiHamburgerMenu } from "react-icons/gi";
import type { SideBarItem } from "../../components/SideBar";
import { aiURL } from "../../config/apiConfig";


type ChatSessionProps = {
  onNewChat: () => void;
  token: string;
};

function ChatSession({ onNewChat, token }: ChatSessionProps) {
  const threadId = useChatContext((s) => s.theadId);
  const createThread = useChatContext((state) => state.createdThread);
  const setThreadId = useChatContext((s) => s.setThreadId);

  const stream = useStream({
    threadId: threadId || null,
    apiUrl: aiURL,
    assistantId: "agent_gestalt",
    apiKey: import.meta.env.VITE_LANGSMITH_API_KEY,
    onThreadId: async (id: string) => {
      const created = await createThread(token, id);
      setThreadId(created.id);
    },
  });

  const handleSubmit = async (
    text: string,
    images?: string[] | null | undefined,
  ) => {
    type ContentItem =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } };

    const content: ContentItem[] = [{ type: "text", text }];

    if (images && images.length > 0) {
      const b64 = await blobURLtoBase64(images[0]);
      content.push({
        type: "image_url",
        image_url: { url: b64 },
      });
    }

    stream.submit({
      messages: [
        {
          role: "human",
          content,
        },
      ],
    });
  };

  return (
    <ChatContainer
      size="lg"
      onNewChat={onNewChat}
      scrollTrigger={stream.messages.length}
      input={
        <ChatInput
          handleSubmit={handleSubmit}
          disabled={stream.isLoading}
          multiModal={true}
        />
      }
    >
      {stream.messages.map((msg) => {
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
    </ChatContainer>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const setThreadId = useChatContext((s) => s.setThreadId);
  const getUserThreads = useChatContext((s) => s.getUserThreads);
  const [token, setToken] = useState<string>("");
  const [showSideBar, setShowSideBar] = useState<boolean>(true);
  const [sessionKey, setSessionKey] = useState(0);
  const [threads, setThreads] = useState<ThreadRead[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");

  const loadUserThreads = useCallback(
    async (authToken: string) => {
      const res = await getUserThreads(authToken);
      setThreads(res);
    },
    [getUserThreads],
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (!user) return;
      const authToken = await user.getIdToken();
      if (!isMounted) return;

      setToken(authToken);
      await loadUserThreads(authToken);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [user, loadUserThreads]);

  const threadOptions: SideBarItem[] = useMemo(
    () =>
      threads.map((t) => ({
        key: t.id,
        label: t.id,

      })),
    [threads],
  );

  const handleNewChat = () => {
    setSelectedThreadId("");
    setThreadId(null);
    setSessionKey((k) => k + 1);
  };

  const handleSelectThread = (val: string) => {
    const id = String(val).trim();
    setSelectedThreadId(id);
    setThreadId(id);
    setSessionKey((k) => k + 1);
  };

  if (!token) {
    return <div className="w-full p-4 text-sm text-text-muted">Loading chat...</div>;
  }

  return (
    <div className="flex flex-row">
      <div
        className={`flex flex-col border-r border-border pr-3 transition-all duration-200 ease-in-out ${showSideBar ? "w-72 gap-2" : "w-10 gap-0"
          }`}
      >
        <button
          type="button"
          aria-label={showSideBar ? "Close sidebar" : "Open sidebar"}
          onClick={() => setShowSideBar((prev) => !prev)}
          className="self-end rounded p-1 transition-colors duration-150 hover:bg-bg-secondary"
        >
          <GiHamburgerMenu />
        </button>
        <div
          className={`overflow-hidden transition-opacity duration-150 ${showSideBar ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
        >
          <SideBar
            selected={selectedThreadId}
            setSelected={handleSelectThread}
            options={threadOptions}
            show={showSideBar}
          />
        </div>
      </div>

      <div className="w-full pl-3">
        <ChatSession key={sessionKey} onNewChat={handleNewChat} token={token} />
      </div>
    </div>
  );
}
