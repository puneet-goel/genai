import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'

const server = new McpServer({
	name: 'file-assistant-server',
	version: '1.0.0'
})

const NOTES_DIR = './notes'

// TOOL 1: list files
server.registerTool('list_files', {}, async () => {
	const files = await fs.readdir(NOTES_DIR)

	return {
		content: [
			{
				type: 'text',
				text: JSON.stringify(files, null, 2)
			}
		]
	}
})

// TOOL 2: create or update file
server.registerTool(
	'create_update_note',
	{
		inputSchema: {
			filename: z.string().nonempty(),
			content: z.string().default('')
		}
	},
	async ({ filename, content }) => {
		const filePath = path.join(NOTES_DIR, filename)

		await fs.writeFile(filePath, content)

		return {
			content: [
				{
					type: 'text',
					text: `Created/Updated ${filename}`
				}
			]
		}
	}
)

// TOOL 3: read file
server.registerTool(
	'read_note',
	{
		inputSchema: {
			filename: z.string().nonempty()
		}
	},
	async ({ filename }) => {
		const filePath = path.join(NOTES_DIR, filename)

		const data = await fs.readFile(filePath, 'utf-8')

		return {
			content: [
				{
					type: 'text',
					text: data
				}
			]
		}
	}
)

// TOOL 4: delete file
server.registerTool(
	'delete_note',
	{
		inputSchema: {
			filename: z.string().nonempty()
		}
	},
	async ({ filename }) => {
		const filePath = path.join(NOTES_DIR, filename)

		await fs.rm(filePath)

		return {
			content: [
				{
					type: 'text',
					text: `${filePath} deleted`
				}
			]
		}
	}
)

const transport = new StdioServerTransport()
await server.connect(transport)
