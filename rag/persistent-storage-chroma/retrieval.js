import dotenv from 'dotenv'
import {
	GoogleGenerativeAIEmbeddings,
	ChatGoogleGenerativeAI
} from '@langchain/google-genai'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import readline from 'readline'

dotenv.config()

const embeddings = new GoogleGenerativeAIEmbeddings({
	model: 'gemini-embedding-2'
})

const vectorStore = await Chroma.fromExistingCollection(embeddings, {
	collectionName: 'test',

	chromaCloudAPIKey: process.env.CHROMA_API_KEY,

	clientParams: {
		host: 'api.trychroma.com',
		ssl: true,

		tenant: process.env.CHROMA_TENANT,

		database: process.env.CHROMA_DATABASE
	}
})

const model = new ChatGoogleGenerativeAI({
	model: 'gemini-3-flash-preview'
})

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

const ask = async () => {
	rl.question('\nAsk question (exit): ', async (query) => {
		if (query.toLowerCase() === 'exit') {
			rl.close()
			return
		}

		const docs = await vectorStore.similaritySearch(query, 3)

		console.log('\nRelevant chunks:\n')

		docs.forEach((doc, index) => {
			console.log(doc.pageContent)
		})

		const context = docs.map((doc) => doc.pageContent).join('\n')
		const response = await model.invoke(`Answer using only the context below. 
			Context: ${context},
			Question: ${query}
		`)

		console.log(response.content)

		await ask()
	})
}

ask()
