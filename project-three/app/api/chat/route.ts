import { StreamingTextResponse, LangChainStream, Message } from 'ai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIMessage, HumanMessage } from 'langchain/schema';

export const runtime = 'edge';
type PromptKey = "original" | "blog" | "technical" | "funPrompt" | "general";

export async function POST(req: Request) {
  const { messages, prompt: rawPrompt } = await req.json();
  const prompt = rawPrompt as PromptKey;
  //console.log('messages', prompt);
  const currentMessageContent = messages[messages.length - 1].content;

  const apiUrl = process.env.REACT_API_URL as string;
  //console.log('URL', apiUrl);
  try {
    const vectorSearch = await fetch(`${apiUrl}/api/vectorSearch`, {
      method: "POST",
      body: currentMessageContent,
    }).then((res) => res.json());

    const prompts: Record<PromptKey, string> = {  
      original : `You are a very enthusiastic Hounder representative who loves to help people learn about all things Hounder! Given the following sections from the Hounder documentation, answer the questions as if you are Hounder using only that information, outputted in PDF. Please provide a detailed technical approach the questions in your response. If you are unsure and the answer is not written in the documentation, say "Sorry, I don't know how to help with that.`,
      blog : `You are an enthusiastic AI assistant named Hounder writing a detailed 1,500 word blog post about yourself and your capabilities. Use a fun, conversational tone and focus on highlighting keywords that describe your skills. Provide numerous examples of how you can help with writing, analysis, questions answering, math, coding, and more. If asked something you don't know, respond "Sorry, I don't know how to help with that."`,
      technical : `You are an AI assistant named Hounder responding to technical questions for proposals with detailed, accurate responses based only on the provided documentation. If asked something not covered in the documentation, respond "Sorry, I don't know how to help with that to prevent guessing."`,
      funPrompt :`You are an enthusiastic AI assistant named Hounder who loves helping people. Respond to questions as if you are Hounder, drawing only on your own knowledge base. If asked something you don't know, say "Sorry, I don't know how to help you with that."`,
      general : `You are an AI assistant named Hounder. Given the context below, respond in the defined tone and voice while preventing hallucination by responding "Sorry, I don't know how to help you with that" if asked something unanswerable.`,

    }

    const selectedPrompt = prompts[prompt] || prompts['original'];

    //console.log('vector search', vectorSearch[0])
    //const text = await response.text();

    //try to parse the repsonse as JSON
    //const vectorSearch = JSON.parse(text);
    //console.log('vector search', vectorSearch);
    // .then((res) => res.text()) // Get the raw response body as a string
    // .then((text) => {
    //   //console.log(text); // Log the raw response body
    //   return JSON.parse(text); // Parse the JSON manually
    // });
    // const vectorSearchJson = JSON.parse(vectorSearch);
  
    const vectorSearchString = vectorSearch
      .map((v: any) => v.pageContent)
      .join("\n\n")
      .replace(/\n/g, " ");
  
  
    //console.log('vector string', vectorSearchString);
    const TEMPLATE = `${selectedPrompt}" 
    
    Context sections:
    ${JSON.stringify(vectorSearchString)}
  
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
    
  } catch (error) {
    console.error('error fetching data', error)
    
  }

}
