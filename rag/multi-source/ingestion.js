import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv'

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import dotenv from 'dotenv'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import fs from 'fs'
import path from 'path'

import 'dotenv/config'

dotenv.config()

// Supported loaders
const LOADER_MAP = {
	'.pdf': PDFLoader,
	'.docx': DocxLoader,
	'.csv': CSVLoader
}

/**
 * step 1. Load the document
 */
const folderPath = '../../resources/'
const files = fs.readdirSync(folderPath)

let allDocs = []

for (const file of files) {
	const fullPath = path.join(folderPath, file)

	const extension = path.extname(file)

	const LoaderClass = LOADER_MAP[extension]

	if (!LoaderClass) {
		console.log(`Skipping unsupported file: ${file}`)
		continue
	}

	try {
		const loader = new LoaderClass(fullPath)
		const docs = await loader.load()

		// Add metadata
		const docsWithMeta = docs.map((doc, index) => {
			doc.metadata = {
				chunkId: index,
				source: file,
				type: extension.replace('.', '')
			}

			return doc
		})

		allDocs.push(...docsWithMeta)

		// console.log(`Loaded: ${{ ...docsWithMeta }}`)
	} catch (error) {
		console.error(`Failed to load ${file}:`, error.message)
	}
}

/**
 * step 2. split the document
 */
const splitter = new RecursiveCharacterTextSplitter({
	chunkSize: 500,
	chunkOverlap: 100
})

const splitDocs = await splitter.splitDocuments(allDocs)

// console.log({ splitDocs })

/**
 * Step 3. create embeddings + vector store
 */

const embeddings = new GoogleGenerativeAIEmbeddings({
	model: 'gemini-embedding-2'
})

const vectorStore = await Chroma.fromDocuments(
	splitDocs,
	embeddings,
	{
		collectionName: 'multi_docs',

		chromaCloudAPIKey: process.env.CHROMA_API_KEY,

		clientParams: {
			host: 'api.trychroma.com',
			ssl: true,
			tenant: process.env.CHROMA_TENANT,
			database: process.env.CHROMA_DATABASE
		}
	}
)

// console.log({ vectorStore })
console.log('Done')
