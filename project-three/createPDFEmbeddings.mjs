import  fs  from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MongoDBAtlasVectorSearch } from "langchain/vectorstores/mongodb_atlas";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MongoClient } from "mongodb";
import "dotenv/config";
import {PDFLoader} from "langchain/document_loaders/fs/pdf";

const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
const dbName = "docs";
const collectionName = "embeddingsHounder";
const collection = client.db(dbName).collection(collectionName);


async function generateAndStoreEmbeddings() {
  try {
    const docs_dir = "_assets/hounder_docs";
    const fileNames = await fs.promises.readdir(docs_dir);
    const filePaths = fileNames.map((fileName) => `${docs_dir}/${fileName}`);
    const fileStreams = filePaths.map((path) => fs.createReadStream(path));
    console.log('fileStreams', fileStreams)
    const buffers = await Promise.all(
      fileStreams.map((stream) => {
        return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
        });
      })
    );
    const firstBuffer = buffers[0];

    const blob = new Blob([firstBuffer]);

    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    console.log("docs loaded");

    await MongoDBAtlasVectorSearch.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      {
        collection,
        indexName: "default",
        textKey: "text",
        embeddingKey: "embedding",
      }
    );
    console.log("embeddings created");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    console.log("Done: Closing Connection");
    await client.close();
  }
}


generateAndStoreEmbeddings();



// console.log(fileNames);
// for (const fileName of fileNames) {
//   const document = await fsp.readFile(`${docs_dir}/${fileName}`, "utf8");
//   console.log(`Vectorizing ${fileName}`);
  
//   const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
//     chunkSize: 500,
//     chunkOverlap: 50,
//   });
//   const output = await splitter.createDocuments([document]);
  
//   await MongoDBAtlasVectorSearch.fromDocuments(
//     output,
//     new OpenAIEmbeddings(),
//     {
//       collection,
//       indexName: "default",
//       textKey: "text",
//       embeddingKey: "embedding",
//     }
//   );
// }

// console.log("Done: Closing Connection");
// await client.close();
