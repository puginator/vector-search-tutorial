import { StreamingTextResponse, LangChainStream, Message } from 'ai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIMessage, HumanMessage } from 'langchain/schema';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const currentMessageContent = messages[messages.length - 1].content;

  const apiUrl = process.env.REACT_API_URL as string || 'http://localhost:3000';

  const vectorSearch = await fetch(`${apiUrl}/api/vectorSearch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: currentMessageContent,
  }).then((res) => res.json());
  //console.log(JSON.stringify(vectorSearch.map((v: any) => v.pageContent.trim())));

  const TEMPLATE = `You are a very enthusiastic Hounder representative who loves to help people learn about all things Hounder! Given the following sections from the Hounder documentation, answer the questions as if you are Hounder using only that information, outputted in PDF. Please provide a detailed technical approach the questions in your response. If you are unsure and the answer is not written in the documentation, say "Sorry, I don't know how to help with that." 
  
  Context sections:
  ${JSON.stringify(vectorSearch)}

  Question: """
  ${currentMessageContent}
  """
  `;

  messages[messages.length -1].content = TEMPLATE;

  const { stream, handlers } = LangChainStream();

  const llm = new ChatOpenAI({
    modelName: "gpt-4-1106-preview",
    streaming: true,
  });

  llm
    .call(
      (messages as Message[]).map(m =>
        m.role == 'user'
          ? new HumanMessage(m.content)
          : new AIMessage(m.content),
      ),
      {},
      [handlers],
    )
    .catch(console.error);

  return new StreamingTextResponse(stream);
}
