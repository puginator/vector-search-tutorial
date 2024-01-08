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
    //console.log(fileNames);

    for (const fileName of fileNames) {
      const fileStream = fs.createReadStream(`${docs_dir}/${fileName}`);

      const pdfBuffer = await streamToBuffer(fileStream);
      //console.log("pdfBuffer length", pdfBuffer.length);
      const pdfBlob = new Blob([pdfBuffer]);

      const loader = new PDFLoader(pdfBlob);

      const docs = await loader.load();
     // console.log('docs', docs.length);

      //console.log(`Docs extracted for ${fileName} - ${docs.length}`);
      if (docs.length === 0) {
      console.log(`No text extracted from ${fileName}`);
      }

      await MongoDBAtlasVectorSearch.fromDocuments(docs, new OpenAIEmbeddings(), {
        collection,
        indexName: "default",
        textKey: "text",
        embeddingKey: "embedding",
      });
    }


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
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    stream.on("error", reject);

    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    
    stream.on("end", () => {
      //console.log('chunks', chunks);
      resolve(Buffer.concat(chunks));
    });
  });
}

generateAndStoreEmbeddings();
