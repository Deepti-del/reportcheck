import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from checker import check_report, load_rules, save_rules

app = FastAPI()

# This allows your frontend webpage to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Data shapes ---

class CompanyRules(BaseModel):
    company_name: str
    primary_font: str
    brand_colours: List[str]
    logo_position: str
    custom_rules: List[str]
    ignored_rules: List[str] = []


# --- Endpoints ---

@app.get("/")
def root():
    return {"message": "Report checker API is running"}


@app.get("/rules")
def get_rules():
    return load_rules()


@app.post("/rules")
def update_rules(rules: CompanyRules):
    existing = load_rules()
    existing["company_name"] = rules.company_name
    existing["primary_font"] = rules.primary_font
    existing["brand_colours"] = rules.brand_colours
    existing["logo_position"] = rules.logo_position
    existing["custom_rules"] = rules.custom_rules
    existing["ignored_rules"] = rules.ignored_rules
    save_rules(existing)
    return {"message": "Rules saved successfully"}


@app.post("/check")
async def check(file: UploadFile = File(...)):
    if not file.filename.endswith((".pdf", ".png", ".jpg", ".jpeg")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PNG, and JPG files are supported"
        )

    # Save uploaded file temporarily
    tmp_path = f"/tmp/{file.filename}"
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Run the check
    results = check_report(tmp_path)

    # Clean up temp file
    os.remove(tmp_path)

    return results


@app.post("/extract-rules")
async def extract_rules(file: UploadFile = File(...)):
    import anthropic
    import base64
    import shutil

    allowed = (".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".txt")
    if not any(file.filename.endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    tmp_path = f"/tmp/{file.filename}"
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if file.filename.endswith(".pdf"):
        import fitz
        doc = fitz.open(tmp_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
    else:
        with open(tmp_path, "r", errors="ignore") as f:
            text = f.read()

    os.remove(tmp_path)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""You are a report quality rule extractor.

Read this document and extract all quality rules, standards, or requirements that could be used to check a report.

Document content:
{text[:3000]}

Return ONLY a JSON array of rule strings. Each rule must be a single clear sentence.
Example format: ["Rule 1 text", "Rule 2 text", "Rule 3 text"]

Extract maximum 15 most important rules. Return only the JSON array, nothing else."""
        }]
    )

    import json
    try:
        raw = message.content[0].text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        rules = json.loads(raw)
        if not isinstance(rules, list):
            rules = []
    except Exception:
        rules = []

    return {"rules": rules}