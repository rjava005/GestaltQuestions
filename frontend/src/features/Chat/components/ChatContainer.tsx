import clsx from "clsx";
import { MathJax } from "better-react-mathjax";
import { RiChatNewLine } from "react-icons/ri";
import { useEffect, useRef } from "react";
type ChatContainerVariant = "demo" | "main";
type Sizes = "sm" | "med" | "lg";

const Variants: Record<ChatContainerVariant, string> = {
  demo:
    "flex flex-col rounded-lg border border-border bg-surface text-text shadow-soft backdrop-blur",
  main:
    "mx-auto flex flex-col rounded-xl border border-border bg-surface-strong p-4 text-text shadow-soft backdrop-blur",
};

const SizeClasses: Record<Sizes, string> = {
  sm: "h-[320px] w-full max-w-md",
  med: "h-[520px] w-full max-w-2xl",
  lg: "h-[720px] w-full max-w-4xl",
};

interface ChatContainerProps {
  input: React.ReactNode;
  children: React.ReactNode;
  variant?: ChatContainerVariant;
  size?: Sizes;
  onNewChat?: () => void;
  scrollTrigger?: number;
}

export default function ChatContainer({
  input,
  children,
  variant = "main",
  size = "med",
  onNewChat,
  scrollTrigger = 0,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [scrollTrigger]);

  return (
    <MathJax>
      <div className={clsx(Variants[variant], SizeClasses[size], "auto-scroll-y")}>
        <div className="mb-2 flex items-center justify-end">
          {/* Tool Bar for Options */}
          {onNewChat ? (
            <button
              type="button"
              onClick={onNewChat}
              aria-label="Start new chat"
              title="New chat"
              className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-text transition hover:bg-surface-strong"
            >
              <RiChatNewLine size={20} />
            </button>
          ) : null}
          
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 auto-scroll-y">
          {children}
          <div ref={bottomRef} />
        </div>
        <div className="mt-3 border-t border-border pt-3">{input}</div>
      </div>
    </MathJax>
  );
}
