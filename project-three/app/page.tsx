"use client";

import {useChat} from "ai/react";
import {useEffect, useRef, useState} from "react";

export default function Chat() {
  const [selectedPrompt, setSelectedPrompt] = useState("default");
  const {messages, input, handleInputChange, handleSubmit} = useChat({
    body: {
      // Add any initial body values here
      prompt: selectedPrompt,
    },
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const handlePromptChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPrompt(event.target.value);
  };

  // const handleSubmitWithPrompt = (event) => {
  //   // Modify handleSubmit to include selectedPrompt
  //   console.log(selectedPrompt)
  //   handleSubmit(event, );
  // };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages]);

  return (
    <div className="mx-auto max-w-md">
      <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
        {messages.length > 0
          ? messages.map((m) => (
              <div
                key={m.id}
                className={`whitespace-pre-wrap pt-5 ${
                  m.role === "user" ? "text-gray-800" : "text-[#219ecc]"
                }`}>
                {m.role === "user" ? "User: " : "Hounder: 🐶 "}
                <div className={"prose"}>{m.content.trim()}</div>
              </div>
            ))
          : null}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit}>
        <label>
        <div className="text-[#219ecc] mb-2">Prompt</div>
        <select
          className=" max-w-md  border border-[#219ecc] rounded mb-8 shadow-xl p-2 focus-within:outline-none focus:outline-none focus:ring-2 focus:ring-[#219ecc] focus:border-transparent"
          value={selectedPrompt}
          onChange={handlePromptChange}>
          <option value="original">Original</option>
          <option value="blog">Blog</option>
          <option value="technical">Technical</option>
          <option value="fun">Fun</option>
          <option value="general">General</option>

          {/* Add more options as needed */}
        </select>
        </label>
        <input
          className=" w-full max-w-md  border border-[#219ecc] rounded mb-8 shadow-xl p-2 focus-within:outline-none focus:outline-none focus:ring-2 focus:ring-[#219ecc] focus:border-transparent"
          value={input}
          placeholder="Ask Hounder something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
