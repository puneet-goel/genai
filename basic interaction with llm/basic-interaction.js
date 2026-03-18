import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'
import readline from 'readline'

dotenv.config()

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY // This is the default and can be omitted
})

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

const chat = ai.chats.create({
  model: "gemini-3-flash-preview"
});

const history = []

async function main() {
	rl.question('Please enter: ', async (userInput) => {
		const response = await chat.sendMessage({
			message: userInput
		})

		// history.push(
		// 	{
		// 		role: 'user',
		// 		parts: [{ text: userInput }]
		// 	},
		// 	{
		// 		role: 'model',
		// 		parts: [{ text: response.text }]
		// 	}
		// )

		console.log(response.text)

		await main()
	})
}

main()
