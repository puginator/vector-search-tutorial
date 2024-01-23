import { StreamingTextResponse, LangChainStream, Message } from 'ai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIMessage, HumanMessage } from 'langchain/schema';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, prompt } = await req.json();
  console.log('messages', prompt);
  const currentMessageContent = messages[messages.length - 1].content;

  const apiUrl = process.env.REACT_API_URL as string;
  //console.log('URL', apiUrl);
  try {
    const vectorSearch = await fetch(`${apiUrl}/api/vectorSearch`, {
      method: "POST",
      body: currentMessageContent,
    }).then((res) => res.json());

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
    const TEMPLATE = `You are a very enthusiastic Hounder representative who loves to help people learn about all things Hounder! Given the following sections from the Hounder documentation, answer the questions as if you are Hounder using only that information, outputted in PDF. Please provide a detailed technical approach the questions in your response. If you are unsure and the answer is not written in the documentation, say "Sorry, I don't know how to help with that." 
    
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
