# ✦ ReportCheck

AI-powered report quality checker. Upload a PDF report, define your quality standards, and get instant feedback on what passed, what failed, and what needs fixing — before you send it to clients or leadership.
![ReportCheck Dashboard](screenshot.png)
<img width="493" height="399" alt="SignIn page1" src="https://github.com/user-attachments/assets/96ded6ec-b56d-48dd-9bd1-31cfbe590dc6" />
<img width="493" height="399" alt="Signup page" src="https://github.com/user-attachments/assets/0de10eb1-36e1-472a-b577-411c57bbc847" />
<img width="493" height="626" alt="Solo Register" src="https://github.com/user-attachments/assets/e552867e-4ab7-4626-8f96-8b2c93e2c0f5" />
<img width="493" height="636" alt="Team Register" src="https://github.com/user-attachments/assets/181cf653-af34-47a3-b618-494709c693d6" />
<img width="1002" height="680" alt="Main Page" src="https://github.com/user-attachments/assets/378e5b77-c9eb-41e7-9e15-da43d66235b7" />
<img width="1002" height="809" alt="Inside Workspace page" src="https://github.com/user-attachments/assets/c899441f-7326-4300-9859-0143f86dadb3" />
<img width="1002" height="680" alt="Rule Define" src="https://github.com/user-attachments/assets/b37b902e-2e84-4b71-b75c-a4e4952bfa23" />
<img width="1002" height="809" alt="Result Screen" src="https://github.com/user-attachments/assets/d4643a8b-2caa-4c9c-856a-cf00d70b5c7b" />
<img width="1002" height="809" alt="Result Screen" src="https://github.com/user-attachments/assets/03e9d63b-e57d-456f-988a-ca247da309b9" />









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
