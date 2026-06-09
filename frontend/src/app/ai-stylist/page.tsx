"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Plus, Send, Sparkles, UserRound } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/Card";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type StyleChatResponse = {
  session_id: string;
  message: string;
};

const initialAssistantMessage =
  "Hi, I am your AI stylist. Tell me where you are going, the mood you want, and anything you want to avoid. I will help you put together a look that fits your wardrobe and the moment.";

const starterPrompts = [
  "What should I wear to a client dinner tonight?",
  "Help me build a polished church outfit.",
  "Style me for a Lagos wedding without overdoing it.",
  "What should I add to make my office looks better?",
];

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === "user";

  return (
    <div className={cn("flex items-end gap-2 sm:gap-3", mine ? "justify-end" : "justify-start")}>
      {!mine ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fuchsiaBrand text-white shadow-soft sm:size-9">
          <Bot className="size-4" aria-hidden="true" />
        </span>
      ) : null}

      <div
        className={cn(
          "max-w-[86%] rounded-[26px] px-4 py-3 text-[15px] leading-7 shadow-sm sm:max-w-[70%] sm:px-5 sm:py-4",
          mine
            ? "rounded-br-lg bg-charcoal text-white"
            : "rounded-bl-lg border border-black/[0.06] bg-white text-charcoal/78",
        )}
      >
        {message.content.split("\n").map((line, index) => (
          <p key={`${message.id}-${index}`} className={index ? "mt-3" : ""}>
            {line}
          </p>
        ))}
      </div>

      {mine ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-charcoal text-white sm:size-9">
          <UserRound className="size-4" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  );
}

export default function AiStylistPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: initialAssistantMessage,
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function startNewChat() {
    setSessionId(undefined);
    setError("");
    setInput("");
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "New chat started. Tell me the occasion, the mood, and any style boundaries you want me to respect.",
      },
    ]);
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed || loading) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      },
    ]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<StyleChatResponse>("/api/ai/style-chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          ...(sessionId ? { session_id: sessionId } : {}),
        }),
      });

      if (response.data?.session_id) {
        setSessionId(response.data.session_id);
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            response.data?.message ||
            "I generated a response, but it came back empty. Try asking again with a little more detail.",
        },
      ]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to reach the AI stylist.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I could not complete that request. ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-104px)] max-w-7xl flex-col overflow-hidden rounded-[30px] border border-black/[0.06] bg-white shadow-soft">
        <section className="shrink-0 border-b border-black/[0.06] bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-fuchsiaBrand/10 text-fuchsiaBrand">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-normal text-charcoal sm:text-2xl">
                  AI Stylist Chat
                </h1>
                <p className="truncate text-sm font-semibold text-charcoal/50">
                  Ask what to wear, how to improve a look, or how to style an event.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-bold text-charcoal/64 transition hover:border-fuchsiaBrand/30 hover:text-fuchsiaBrand sm:px-4"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </div>
        </section>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_280px]">
          <Card className="flex min-h-0 flex-col overflow-hidden rounded-none border-0 bg-transparent shadow-none">
            <div className="flex-1 overflow-y-auto bg-[#fbfbfb] px-3 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl space-y-5">
                {messages.map((message) => (
                  <Bubble key={message.id} message={message} />
                ))}

                {loading ? (
                  <div className="flex justify-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fuchsiaBrand text-white sm:size-9">
                      <Bot className="size-4" aria-hidden="true" />
                    </span>
                    <div className="inline-flex items-center gap-2 rounded-[24px] rounded-bl-md border border-black/[0.06] bg-white px-5 py-4 text-sm font-bold text-charcoal/54 shadow-sm">
                      <Loader2 className="size-4 animate-spin text-fuchsiaBrand" aria-hidden="true" />
                      Styling your answer...
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-black/[0.06] bg-white p-3 sm:p-5">
              <form onSubmit={submit} className="mx-auto flex max-w-4xl items-end gap-3">
                <label className="sr-only" htmlFor="stylist-message">
                  Message the AI stylist
                </label>
                <textarea
                  id="stylist-message"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder="Ask what to wear..."
                  rows={1}
                  className="max-h-36 min-h-14 flex-1 resize-none rounded-[24px] border border-black/10 bg-blush px-5 py-4 text-sm leading-6 text-charcoal outline-none transition placeholder:text-charcoal/38 focus:border-fuchsiaBrand"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="grid size-14 shrink-0 place-items-center rounded-full bg-fuchsiaBrand text-white shadow-pink transition hover:bg-[#de0876] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="size-5" aria-hidden="true" />
                </button>
              </form>
              {error ? <p className="mx-auto mt-3 max-w-4xl text-sm font-bold text-amber-700">{error}</p> : null}
            </div>
          </Card>

          <aside className="hidden min-h-0 border-l border-black/[0.06] bg-white p-5 lg:block">
            <div className="rounded-3xl bg-blush p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-fuchsiaBrand">
                {sessionId ? "Conversation active" : "New conversation"}
              </p>
              <p className="mt-2 text-sm leading-6 text-charcoal/58">
                Share occasion, weather, wardrobe constraints, color preferences, and the impression you want to make.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-black text-charcoal">Try asking</p>
              <div className="mt-3 space-y-2">
                {starterPrompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    disabled={loading}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-left text-sm font-bold leading-6 text-charcoal/62 transition hover:border-fuchsiaBrand/30 hover:text-fuchsiaBrand disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
