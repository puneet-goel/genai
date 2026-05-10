import dotenv from 'dotenv'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { StateGraph, END, START } from '@langchain/langgraph'
import { PDFParse } from 'pdf-parse'

dotenv.config()

const model = new ChatGoogleGenerativeAI({
	model: 'gemini-2.5-flash'
})

const pdfPath = process.argv[2]

// state
const initialState = {
	resumePath: '',
	resume: '',
	jd: '',
	resumeSkills: [],
	jdSkills: [],
	missingSkills: [],
	matchScore: 0,
	retries: 0
}

// nodes
const parseResumePDF = async (state) => {
	console.log('Reading resume PDF...')

	const parser = new PDFParse({ url: state.resumePath })
	const result = await parser.getText()

	return {
		...state,
		resume: result.text
	}
}

const extractSkillsFromResume = async (state) => {
	console.log('Extracting skills from Resume')

	const prompt = `
  Extract all the skills used in this resume.
  Return only comma-separated skills.
  Resume: ${state.resume}`

	const output = await model.invoke(prompt)

	const skills = output.content.split(',').map((ele) => ele.trim())
	return {
		...state,
		resumeSkills: [...skills]
	}
}

const extractSkillsFromJd = async (state) => {
	console.log('Extracting skills from Jd')

	const prompt = `
  Extract skills from this job description.
  Return only comma-separated skills.
  Resume: ${state.jd}`

	const output = await model.invoke(prompt)

	const skills = output.content.split(',').map((ele) => ele.trim())
	return {
		...state,
		jdSkills: [...skills]
	}
}

const compareSkills = async (state) => {
	const prompt = `
  Skills required in job description: ${state.jdSkills},
  Skills present in resume: ${state.resumeSkills},
  Find all the skills that are present in job description but missing in resume.
  Return only comma-separated skills.`

	const output = await model.invoke(prompt)
	const missingSkills =
		typeof output.content === 'string'
			? output.content.split(',').map((ele) => ele.trim())
			: []

	const matched = state.jdSkills.length - missingSkills.length
	const score = Math.round((matched / state.jdSkills.length) * 100)

	console.log('Score:', score)

	return {
		...state,
		missingSkills,
		matchScore: score
	}
}

const improveResume = async (state) => {
	console.log('Improving resume...')

	const prompt = `
  A candidate wants to apply for a job.
  Missing skills: ${state.missingSkills.join(', ')}
  
  Current resume: ${state.resume}
  
  Rewrite the resume professionally.
  Add stronger bullet points.
  Dont change the structure of the resume.
  Just rewrite the points where possible improvemnt is there.
  Include missing relevant keywords naturally.`

	const response = await model.invoke(prompt)

	return {
		...state,
		resume: response.content,
		retries: state.retries + 1
	}
}

const finalReport = async (state) => {
	console.log('\n===== FINAL REPORT =====')

	console.log('Match Score:', state.matchScore + '%')
	console.log('Missing Skills:', state.missingSkills)
	console.log('Retries Used:', state.retries)
	console.log('resume', state.resume)

	return state
}

// graph
const graph = new StateGraph({
	channels: {
		resume: {},
		jd: {},
		resumeSkills: {},
		jdSkills: {},
		missingSkills: {},
		matchScore: {},
		retries: {},
		resumePath: {}
	}
})

// add nodes to graph
graph.addNode('parseResumePDF', parseResumePDF)
graph.addNode('extractSkillsFromResume', extractSkillsFromResume)
graph.addNode('extractSkillsFromJd', extractSkillsFromJd)
graph.addNode('compareSkills', compareSkills)
graph.addNode('improveResume', improveResume)
graph.addNode('finalReport', finalReport)

// set flow
graph.addEdge(START, 'parseResumePDF')
graph.addEdge('parseResumePDF', 'extractSkillsFromJd')
graph.addEdge('extractSkillsFromJd', 'extractSkillsFromResume')
graph.addEdge('extractSkillsFromResume', 'compareSkills')

graph.addConditionalEdges('compareSkills', (state) => {
	// good enough
	if (state.matchScore >= 90 || state.retries >= 2) {
		return 'finalReport'
	}

	// try improving
	return 'improveResume'
})

graph.addEdge('improveResume', 'extractSkillsFromResume')
graph.addEdge('finalReport', END)

// compile
const app = graph.compile()

await app.invoke({
	...initialState,

	resumePath: pdfPath,
	jd: `
Looking for backend engineer with:
Node.js,
TypeScript,
Docker,
AWS
`
})
