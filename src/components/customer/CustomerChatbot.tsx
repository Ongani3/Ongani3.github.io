import React, { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

async function sendChat(messages: { role: string; content: string }[]) {
  // Use Supabase Edge Functions via the Supabase client so it works on GitHub Pages
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { messages },
  });
  if (error) {
    throw new Error(error.message || "Edge function error");
  }
  return data as any;
}

const CustomerChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your CRM assistant. Ask me about your orders, appointments, promotions, or store policies.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const apiMessages = useMemo(
    () => messages.map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  const onSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await sendChat(apiMessages.concat({ role: "user", content: trimmed }));
      const content = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't find an answer.";
      const botMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content };
      setMessages((prev) => [...prev, botMsg]);
      queueMicrotask(() => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" }));
    } catch (e: any) {
      const botMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: `Error: ${e.message}` };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-64 overflow-auto space-y-3 pr-2">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
              <div className={`inline-block rounded px-3 py-2 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about orders, appointments, promotions..."
        />
        <Button onClick={onSend} disabled={loading}>{loading ? "Thinking..." : "Send"}</Button>
      </CardFooter>
    </Card>
  );
};

export default CustomerChatbot;


