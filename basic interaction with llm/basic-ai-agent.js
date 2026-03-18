import { GoogleGenAI, Type } from '@google/genai'
import dotenv from 'dotenv'

/**
 * chat.ai and sendMessgae is basically a thin wrapper around generateContent()
 * also chat api is state less while generatecontent is not
 * same speed its just with generate content you get more control over the chats
 * like saving only last 20 chats and many more things even if last 20 chats options is provided by chat api
 */
dotenv.config()

// ------------------
// Tools
// ------------------

function MulTwoNums(num1, num2) {
	return num1 * num2
}

function AddTwoNums(num1, num2) {
	return num1 + num2
}

// ------------------
// Tool Map
// ------------------

const tools = {
	add_two_nums: ({ num1, num2 }) => AddTwoNums(num1, num2),
	mul_two_nums: ({ num1, num2 }) => MulTwoNums(num1, num2)
}

// ------------------
// Tool Declarations
// ------------------

const addTwoNumsDeclaration = {
	name: 'add_two_nums',
	description:
		'Add two numbers. Use this for any addition step when solving math expressions.',
	parameters: {
		type: Type.OBJECT,
		properties: {
			num1: {
				type: Type.NUMBER
			},
			num2: {
				type: Type.NUMBER
			}
		},
		required: ['num1', 'num2']
	}
}

const mulTwoNumsDeclaration = {
	name: 'mul_two_nums',
	description:
		'Multiply two numbers. Use this when solving multiplication operations.',
	parameters: {
		type: Type.OBJECT,
		properties: {
			num1: {
				type: Type.NUMBER
			},
			num2: {
				type: Type.NUMBER
			}
		},
		required: ['num1', 'num2']
	}
}

// ------------------
// Gemini Client
// ------------------

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY
})

// ------------------
// Agent Loop
// ------------------

async function runAgent(userPrompt) {
	let contents = [{ role: 'user', parts: [{ text: userPrompt }] }]

	while (true) {
		const response = await ai.models.generateContent({
			model: 'gemini-3-flash-preview',
			contents,
			config: {
				tools: [
					{
						functionDeclarations: [addTwoNumsDeclaration, mulTwoNumsDeclaration]
					}
				]
			}
		})

		const call = response.functionCalls?.[0]

		if (!call) {
			console.log('Final answer:', response.text)
			break
		}

		console.log('Tool requested:', call.name)

		const tool = tools[call.name]

		const result = await tool(call.args)

		console.log('Tool result:', result)
		contents.push(response.candidates[0].content)

		contents.push({
			role: 'tool',
			parts: [
				{
					functionResponse: {
						name: call.name,
						response: { result }
					}
				}
			]
		})
	}
}

// ------------------
// Run
// ------------------

runAgent('What is 12 + 8 * 5 + 8?')
