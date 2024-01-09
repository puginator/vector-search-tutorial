"use client";

import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      {messages.length > 0
        ? messages.map((m) => (
            <div key={m.id} className={`whitespace-pre-wrap pt-5 ${m.role === "user" ? "text-blue-500" : "text-gray-500"}`}>
              {m.role === "user" ? "User: " : "Hounder: "}
              <ReactMarkdown>{m.content.trim()}</ReactMarkdown>
            </div>
          ))
        : null}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
          value={input}
          placeholder="Ask Hounder something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
