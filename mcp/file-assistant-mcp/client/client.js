import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export default async function createClient() {
	const transport = new StdioClientTransport({
		command: 'node',
		args: ['./server/server.js']
	})

	const client = new Client({
		name: 'file-client',
		version: '1.0.0'
	})

	await client.connect(transport)

	return client
}
