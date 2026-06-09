# ✦ ReportCheck

AI-powered report quality checker. Upload a PDF report, define your quality standards, and get instant feedback on what passed, what failed, and what needs fixing — before you send it to clients or leadership.

## What it does

- Upload any PDF, PNG, or JPG report
- Define quality rules in plain English or upload an existing style guide and let AI extract the rules automatically
- AI checks every page against your rules and returns a pass / fail / warn result for each one
- Supports multiple workspaces — different rule sets for different report types
- Works for solo users and teams

## How it works
Upload report → AI reads every page → Checks against your rules → Returns results with score and explanation per rule

## Tech stack

- **Backend** — Python, FastAPI, Claude AI (Anthropic)
- **Frontend** — React
- **PDF processing** — PyMuPDF
- **AI** — Claude Sonnet vision model

## Running locally

### Backend

```bash
cd backend
pip install fastapi uvicorn anthropic pymupdf python-dotenv python-multipart
```

Create a `.env` file in the backend folder:
ANTHROPIC_API_KEY=your-key-here

Start the server:

```bash
cd backend
export ANTHROPIC_API_KEY=your-key-here
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000`

## Status

Currently in prototype stage. Actively seeking feedback from report-heavy teams in energy, finance, and consulting.

## Contact
Built by Deepti Satish
[LinkedIn](https://www.linkedin.com/in/deepti-satish/) · [GitHub](https://github.com/Deepti-del)
