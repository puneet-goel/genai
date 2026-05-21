import readline from 'readline'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import dotenv from 'dotenv'
import createClient from '../client/client.js'

dotenv.config()

const model = new ChatGoogleGenerativeAI({
	model: 'gemini-2.5-flash'
})

const mcpClient = await createClient()

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

const ask = (question) => {
	return new Promise((resolve) => {
		rl.question(question, resolve)
	})
}

const main = async () => {
	try {
		const userInput = await ask('Ask something: ')

		// 1. Get tools from MCP server
		const toolResponse = await mcpClient.listTools()

		// 2. Convert MCP tools to LLM tools
		const tools = toolResponse.tools.map((tool) => ({
			name: tool.name,
			description: tool.description || '',
			schema: tool.inputSchema
		}))

		// 3. Ask LLM
		const response = await model.invoke(userInput, {
			tools
		})

		const toolCall = response.tool_calls?.[0]

		// 4. If model wants tool
		if (toolCall) {
			const toolName = toolCall.name

			console.log('\nLLM selected tool:', toolName)

			const result = await mcpClient.callTool({
				name: toolName,
				arguments: toolCall.args
			})

			console.log('\nTool Result:')
			console.log(result.content[0].text)
		} else {
			// Normal text response
			console.log(response.content)
		}
	} catch (error) {
		console.error(error)
	}

	main()
}

main()
