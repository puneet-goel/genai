# ResumeOptimizer

AI-powered Resume Optimization Agent built with LangGraph, Node.js, and Google Gemini.

---

## Tech Stack

* LangGraph — workflow orchestration
* Node.js — backend runtime
* Google Gemini 2.5 Flash — LLM reasoning
* `pdf-parse` — PDF text extraction
* `dotenv` — environment variables

---

## Installation

```bash
git clone <your-repo-url>
cd hiregraph

npm install
```

Create `.env`

```env
GOOGLE_API_KEY=your_api_key
```

---

## Run

Pass resume PDF path as an argument:

```bash
node index.js ./resume.pdf
```

---

## Workflow

```text
                           START
                             │
                             ▼
                  ┌────────────────────┐
                  │   Parse Resume PDF │
                  └──────────┬─────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │ Extract JD Skills  │
                  └──────────┬─────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │ Extract Resume     │
                  │ Skills             │
                  └──────────┬─────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │  Compare Skills    │
                  └──────────┬─────────┘
                             │
                 ┌───────────┴────────────┐
                 │                        │
                 ▼                        ▼
          Score >= 90%              Score < 90%
                 │                        │
                 │                        ▼
                 │              ┌──────────────────┐
                 │              │ Improve Resume   │
                 │              └────────┬─────────┘
                 │                       │
                 │                       ▼
                 │             (Loop back for re-check)
                 │
                 ▼
        ┌────────────────────┐
        │   Final Report     │
        └──────────┬─────────┘
                   │
                   ▼
                  END
```
