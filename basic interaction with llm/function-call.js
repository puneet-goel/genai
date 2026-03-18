import { GoogleGenAI, Type } from '@google/genai'
import dotenv from 'dotenv'

/**
 * limitation
 * if llm needs to call multiple tools we cant do in one go
 * llm won't call your function by itself
 */

dotenv.config()

export const fetchPostsDataFromJsonPlaceholder = async () => {
	const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
	const data = await response.json()
	return data
}

export const AddTwoNums = (num1, num2) => {
	return num1 + num2
}

// Configure the client
const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY // This is the default and can be omitted
})

// Define the function declaration for the model
const fetchDummyDataDeclaration = {
	name: 'fetch_posts_data_from_json_placeholder',
	description: 'fetch posts data from json placeholder. its dummy data'
}

const addTwoNumsDeclaration = {
	name: 'add_two_nums',
	description: 'function to add two numbers.',
	parameters: {
		type: Type.OBJECT,
		properties: {
			num1: {
				type: Type.NUMBER,
				description: 'first integer number'
			},
			num2: {
				type: Type.NUMBER,
				description: 'second integer number'
			}
		},
		required: ['num1', 'num2']
	}
}

// Send request with function declarations
const response = await ai.models.generateContent({
	model: 'gemini-3-flash-preview',
	contents: 'what is 3 + 5 + 8?',
	config: {
		tools: [
			{
				functionDeclarations: [addTwoNumsDeclaration, fetchDummyDataDeclaration]
			}
		]
	}
})

console.log(JSON.stringify(response))

// Check for function calls in the response
if (response.functionCalls && response.functionCalls.length > 0) {
	const functionCall = response.functionCalls[0] // Assuming one function call
	console.log(`Function to call: ${functionCall.name}`)
	console.log(`ID: ${functionCall.id}`)
	console.log(`Arguments: ${JSON.stringify(functionCall.args)}`)
} else {
	console.log('No function call found in the response.')
	console.log(response.text)
}
