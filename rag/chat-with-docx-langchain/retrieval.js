import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'
import dotenv from 'dotenv'
import {
	GoogleGenerativeAIEmbeddings,
	ChatGoogleGenerativeAI
} from '@langchain/google-genai'
import fs from 'fs'

/**
User Question
      ↓
RETRIEVAL
(Search relevant chunks)
      ↓
AUGMENTATION
(Add chunks to prompt)
      ↓
GENERATION
(LLM writes answer)
 */

dotenv.config()
const userQuestion = 'tell me about bitcoin'

const embeddings = new GoogleGenerativeAIEmbeddings({
	model: 'gemini-embedding-2'
})

/**
 * Step 5. retrieve the vectors back to vector store
 * make sure using same embedding model
 */
const vectorStore = new MemoryVectorStore(embeddings)

const savedVectors = JSON.parse(fs.readFileSync('./vectors.json', 'utf8'))

vectorStore.memoryVectors = savedVectors

// console.log({ savedVectors })

/**
 * Step 6. retrieve the relevant chunks
 */
const retriever = vectorStore.asRetriever({
	k: 1
})

const relevantDocs = await retriever.invoke(userQuestion)

// console.log({ relevantDocs })

/**
 * Step 7. generate an answer with augmented (context)
 */
const model = new ChatGoogleGenerativeAI({
	// apiKey: process.env.GOOGLE_API_KEY,
	model: 'gemini-3-flash-preview'
})

const context = relevantDocs.map((doc) => doc.pageContent).join('\n')

const response = await model.invoke(`
Answer using only the context below.

Context:
${context}

Question:
${userQuestion}
`)

console.log(response.content)
