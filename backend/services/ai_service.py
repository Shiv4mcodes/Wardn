import os
import re
import json
import base64
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
VISION_PROVIDER = os.getenv("VISION_PROVIDER", "groq").lower()

ROLE_TITLES = {
    "plumbing": "Plumber",
    "electrical": "Electrician",
    "it/equipment": "IT Support",
    "facilities": "Facilities Team",
    "other": "Admin"
}

ROSTER = {
    "plumbing": ["Raj", "Suresh"],
    "electrical": ["Vikram", "Anil"],
    "it/equipment": ["Priya", "Karan"],
    "facilities": ["Meena", "Deepak"],
    "other": ["Staff Alex", "Staff Sam"]
}

def get_workload_assignee(category: str, open_tickets: list) -> tuple:
    cat_key = category.lower()
    role_title = ROLE_TITLES.get(cat_key, "Admin")
    candidates = ROSTER.get(cat_key, ROSTER["other"])

    counts = {c: 0 for c in candidates}
    for t in open_tickets:
        assignee_str = t.get("assignee", "")
        for c in candidates:
            if c in assignee_str:
                counts[c] += 1

    # Pick candidate with lowest count
    sorted_candidates = sorted(candidates, key=lambda c: counts[c])
    selected = sorted_candidates[0]
    other = sorted_candidates[1]

    formatted_assignee = f"{selected} ({role_title})"
    reasoning = f"Assigned to {selected} ({role_title}) — workload: {counts[selected]} open ticket(s) vs {other}'s {counts[other]}"

    return formatted_assignee, reasoning


def analyze_image_with_groq(image_bytes: bytes, user_text: str) -> str:
    """Analyze image using Groq Vision model."""
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        vision_models = [
            "llama-3.2-11b-vision-preview",
            "llama-3.2-90b-vision-preview",
            "llava-v1.5-7b-4096"
        ]
        
        for model in vision_models:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Describe precisely what infrastructure/equipment damage or issue is visible in this photo. Highlight object, damage type, and severity indicators in 2-3 sentences."},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                            ]
                        }
                    ],
                    temperature=0.2,
                    max_tokens=300
                )
                if response.choices and response.choices[0].message.content:
                    return response.choices[0].message.content.strip()
            except Exception as model_err:
                print(f"[AI Service] Groq vision model {model} failed: {model_err}")
                continue
    except Exception as e:
        print(f"[AI Service] Groq vision failed: {e}")
    return ""

def analyze_image_with_gemini(image_bytes: bytes, user_text: str) -> str:
    """Fallback image analysis using Google Gemini."""
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=['Describe precisely what infrastructure/equipment damage or issue is visible in this photo. Highlight object, damage type, and severity indicators in 2-3 sentences.', image_bytes]
        )
        if response.text:
            return response.text.strip()
    except Exception as e:
        print(f"[AI Service] Gemini vision failed: {e}")
    return ""

def get_image_description(image_bytes: bytes, user_text: str) -> str:
    """Attempts image analysis via configured provider with fallback."""
    if not image_bytes:
        return "No image provided."
        
    if VISION_PROVIDER == "groq" and GROQ_API_KEY:
        desc = analyze_image_with_groq(image_bytes, user_text)
        if desc:
            return desc

    if GEMINI_API_KEY:
        desc = analyze_image_with_gemini(image_bytes, user_text)
        if desc:
            return desc
            
    # If no vision API succeeds, fallback to clean text summary
    return f"Photo attached shows reported issue: {user_text}"

def process_ticket_ai(image_bytes: bytes, user_text: str) -> dict:
    """
    Main extraction pipeline:
    1. Extract visual damage description from image.
    2. Combine with user text and call Groq LLM for strict JSON categorization & priority scoring.
    """
    image_desc = get_image_description(image_bytes, user_text)
    
    prompt = f"""You are an expert infrastructure and facility issue triage AI.
Analyze the following report:
- User Text Input: "{user_text}"
- Vision Analysis of Image: "{image_desc}"

Task: Respond with STRICT JSON ONLY. No preamble, no markdown backticks, no markdown formatting.

JSON schema:
{{
  "category": "plumbing" | "electrical" | "IT/equipment" | "facilities" | "other",
  "location": "Inferred location or 'Unspecified'",
  "description": "A clean 1-2 sentence combined summary of the issue",
  "severity_guess": "HIGH" | "MEDIUM" | "LOW",
  "severity_reasoning": "One concise sentence explaining why this severity was assigned."
}}
"""

    raw_json = ""
    try:
        if GROQ_API_KEY:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=400
            )
            if response.choices and response.choices[0].message.content:
                raw_json = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[AI Service] Groq LLM text analysis failed: {e}")

    parsed = parse_ai_json(raw_json, user_text, image_desc)
    
    # Default role title mapping
    cat_key = parsed.get("category", "other").lower()
    assignee = ROLE_TITLES.get(cat_key, "Admin")
    parsed["assignee"] = assignee
    return parsed

def parse_ai_json(raw_text: str, user_text: str, image_desc: str) -> dict:
    """Safely parse AI JSON response with robust defaults."""
    default = {
        "category": "facilities",
        "location": "Main Facility",
        "description": f"{user_text}. {image_desc}".strip(),
        "severity_guess": "MEDIUM",
        "severity_reasoning": "Standard facility maintenance requirement."
    }

    if not raw_text:
        return default

    clean_text = re.sub(r'```json\s*', '', raw_text)
    clean_text = re.sub(r'```\s*$', '', clean_text).strip()

    try:
        data = json.loads(clean_text)
        category = str(data.get("category", "facilities")).lower()
        if category not in ["plumbing", "electrical", "it/equipment", "facilities", "other"]:
            category = "facilities"
            
        severity = str(data.get("severity_guess", data.get("severity", "MEDIUM"))).upper()
        if severity not in ["HIGH", "MEDIUM", "LOW"]:
            severity = "MEDIUM"

        return {
            "category": category,
            "location": str(data.get("location", "Unspecified")),
            "description": str(data.get("description", f"{user_text}. {image_desc}")),
            "severity_guess": severity,
            "severity_reasoning": str(data.get("severity_reasoning", "Assigned based on visual and textual report analysis."))
        }
    except Exception as e:
        print(f"[AI Service] Error parsing JSON response: {e}. Raw text was: {raw_text}")
        return default
