import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'
import dotenv from 'dotenv'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import fs from "fs";

dotenv.config()

/**
 * step 1. Load the document
 */
const loader = new DocxLoader('../../resources/docx/bitcoin_and_crypto.docx')

const docs = await loader.load()

console.log({ docs })

/**
 * step 2. split the document
 */
const splitter = new RecursiveCharacterTextSplitter({
	chunkSize: 500,
	chunkOverlap: 200
})

const splitDocs = await splitter.splitDocuments(docs)

console.log({ splitDocs })

/**
 * Step 3. create embeddings + vector store
 */

const embeddings = new GoogleGenerativeAIEmbeddings({
	model: 'gemini-embedding-2'
})

/**
 * Test whether embeddings are working or not
 */
const testEmbedding = await embeddings.embedQuery(
  "What is Bitcoin?"
);

console.log(testEmbedding.length);
console.log(testEmbedding.slice(0, 5));

const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings)

console.log({ vectorStore }, vectorStore.memoryVectors[0])

/**
 * Step 4. presist the vectors for future
 */
const vectorsToSave = vectorStore.memoryVectors.map(item => ({
  content: item.content,
  embedding: item.embedding,
  metadata: item.metadata,
}));

fs.writeFileSync(
  "./vectors.json",
  JSON.stringify(vectorsToSave, null, 2)
);