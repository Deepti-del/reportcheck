import anthropic
import base64
import os
import fitz  # this is pymupdf
from dotenv import load_dotenv

# Load your API key from the .env file
load_dotenv()

# Connect to Claude
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Convert first page of PDF to an image
pdf_path = "test_report.pdf"
doc = fitz.open(pdf_path)
page = doc[0]  # page 0 means first page
pix = page.get_pixmap(dpi=150)
pix.save("test_report.png")
print("PDF converted to image successfully")

# Load the converted image
with open("test_report.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

# Send the image to Claude and ask it to check quality
message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
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
                    "text": "You are a report quality checker. Look at this report image and tell me: 1) Are the fonts consistent? 2) Is the layout aligned neatly? 3) What colours are used? 4) Any quality issues you notice?"
                }
            ],
        }
    ],
)

print(message.content[0].text)