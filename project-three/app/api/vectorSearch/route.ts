import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MongoDBAtlasVectorSearch } from "langchain/vectorstores/mongodb_atlas";
import mongoClientPromise from '@/app/lib/mongodb';

export async function POST(req: Request) {
  const client = await mongoClientPromise;
  const dbName = "docs";
  const collectionName = "embeddingsHounder";
  try {
    const collection = client.db(dbName).collection(collectionName);

    const question = await req.text();
    //console.log('question', question)
    //console.log('collection', collection)
    const vectorStore = new MongoDBAtlasVectorSearch(
      new OpenAIEmbeddings({
        modelName: "text-embedding-ada-002",
        stripNewLines: true,
      }),
      {
        collection,
        indexName: "default",
        textKey: "text",
        embeddingKey: "embedding",
      }
    );
      
    const retriever = vectorStore.asRetriever({
      searchType: "mmr",
      searchKwargs: {
        fetchK: 20, //number of documents to fetch
        lambda: 0.1, // Increase this value for more diverse results
      },
    });

    const retrieverOutput = await retriever.getRelevantDocuments(question);
    //console.log('retriever output', retrieverOutput)
    // Return a response with JSON data
    //return Response.json(retrieverOutput)
    return new Response(JSON.stringify(retrieverOutput), {
      headers: {"Content-Type": "application/json"},
      status: 200, // or appropriate HTTP status code
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({message: "Internal server error", error}), {
      headers: {"Content-Type": "application/json"},
      status: 500, // Internal Server Error

    });
  }
}