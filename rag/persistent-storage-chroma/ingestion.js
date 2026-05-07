import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import dotenv from 'dotenv'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { Chroma } from '@langchain/community/vectorstores/chroma'

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
	chunkSize: 100,
	chunkOverlap: 20
})

const splitDocs = await splitter.splitDocuments(docs)

console.log({ splitDocs })

/**
 * Step 3. create embeddings + vector store
 */

const embeddings = new GoogleGenerativeAIEmbeddings({
	model: 'gemini-embedding-2'
})

const vectorStore = await Chroma.fromTexts(
	splitDocs.map(e => e.pageContent),
	splitDocs.map((_, i) => ({
		chunkId: i
	})),
	embeddings,
	{
		collectionName: 'test',

		chromaCloudAPIKey: process.env.CHROMA_API_KEY,

		clientParams: {
			host: 'api.trychroma.com',
			ssl: true,
			tenant: process.env.CHROMA_TENANT,
			database: process.env.CHROMA_DATABASE
		}
	}
)

console.log({ vectorStore })
