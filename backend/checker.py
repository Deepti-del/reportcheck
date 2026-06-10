import anthropic
import base64
import json
import os
import fitz
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

RULES_FILE = os.path.join(os.path.dirname(__file__), "company_rules.json")


def load_rules():
    with open(RULES_FILE, "r") as f:
        return json.load(f)


def save_rules(rules: dict):
    with open(RULES_FILE, "w") as f:
        json.dump(rules, f, indent=2)


def pdf_to_images(pdf_path: str) -> list:
    doc = fitz.open(pdf_path)
    images = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        img_path = f"/tmp/page_{i}.png"
        pix.save(img_path)
        images.append(img_path)
    return images


def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def build_prompt(rules: dict) -> str:
    all_rules = []
    ignored = rules.get("ignored_rules", [])

    # Add default rules — skip any that are ignored
    for i, rule in enumerate(rules["default_rules"], 1):
        if rule in ignored:
            continue
        all_rules.append(f"Rule {i} [Default]: {rule}")

    # Add company specific rules
    offset = len(rules["default_rules"])
    if rules.get("primary_font"):
        offset += 1
        rule = f"Primary font must be {rules['primary_font']}"
        if rule not in ignored:
            all_rules.append(f"Rule {offset} [Font]: {rule}")

    if rules.get("brand_colours"):
        offset += 1
        colours = ", ".join(rules["brand_colours"])
        rule = f"Brand colours must come from this palette: {colours}"
        if rule not in ignored:
            all_rules.append(f"Rule {offset} [Colour]: {rule}")

    if rules.get("logo_position"):
        offset += 1
        rule = f"Logo must be in the {rules['logo_position']}"
        if rule not in ignored:
            all_rules.append(f"Rule {offset} [Logo]: {rule}")

    for rule in rules.get("custom_rules", []):
        offset += 1
        if rule not in ignored:
            all_rules.append(f"Rule {offset} [Custom]: {rule}")

    rules_text = "\n".join(all_rules)
    company = rules.get("company_name", "this company")

    return f"""You are a strict report quality checker for {company}.

Check this report image against every rule below:

{rules_text}

For EACH rule respond with exactly this format on its own line:
RULE [number] | [PASS or FAIL or WARN] | [one sentence explanation of what you found] | [if FAIL or WARN: one specific actionable sentence telling exactly how to fix it. If PASS: leave empty]

Examples:
RULE 1 | PASS | Font is consistently sans-serif throughout all sections |
RULE 2 | FAIL | KPI cards are unequal width — the third card is narrower than the others | Resize the third KPI card to match the width of the first two cards
RULE 3 | WARN | No data source label found on the charts | Add a source label below each chart indicating the data origin and date

After all rules add:
SUMMARY
Total: [number]
Passed: [number]
Failed: [number]
Warnings: [number]
Score: [number]/10

Be strict. Only mark PASS if you can clearly confirm the rule is met.
Mark WARN if you cannot clearly confirm either way.
Mark FAIL if the rule is clearly not met."""


def parse_results(response_text: str) -> dict:
    results = []
    summary = {}

    for line in response_text.split("\n"):
        line = line.strip()
        if line.startswith("RULE"):
            parts = line.split("|")
            if len(parts) >= 3:
                rule_part = parts[0].strip()
                status = parts[1].strip()
                explanation = parts[2].strip()
                suggestion = parts[3].strip() if len(parts) > 3 else ""
                rule_num = rule_part.replace("RULE", "").strip()
                results.append({
                    "rule_number": rule_num,
                    "status": status,
                    "explanation": explanation,
                    "suggestion": suggestion
                })
        elif line.startswith("Total:"):
            summary["total"] = line.replace("Total:", "").strip()
        elif line.startswith("Passed:"):
            summary["passed"] = line.replace("Passed:", "").strip()
        elif line.startswith("Failed:"):
            summary["failed"] = line.replace("Failed:", "").strip()
        elif line.startswith("Warnings:"):
            summary["warnings"] = line.replace("Warnings:", "").strip()
        elif line.startswith("Score:"):
            summary["score"] = line.replace("Score:", "").strip()

    return {"results": results, "summary": summary}


def check_report(pdf_path: str) -> dict:
    rules = load_rules()
    image_paths = pdf_to_images(pdf_path)
    all_results = []

    for i, image_path in enumerate(image_paths):
        print(f"Checking page {i + 1} of {len(image_paths)}...")
        image_data = encode_image(image_path)
        prompt = build_prompt(rules)

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ],
                }
            ],
        )

        page_results = parse_results(message.content[0].text)
        page_results["page"] = i + 1
        all_results.append(page_results)

    return {
        "total_pages": len(image_paths),
        "pages": all_results
    }