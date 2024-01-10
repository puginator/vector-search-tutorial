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
        fetchK: 50, //number of documents to fetch
        lambda: 0.5, // Increase this value for more diverse results
      },
    });

    const retrieverOutput = await retriever.getRelevantDocuments(question);

    // Return a response with JSON data
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