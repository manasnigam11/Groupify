import os
import json
from google import genai

# Naye package ka client
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY is not set in environment variables.")
    return genai.Client(api_key=api_key)

async def generate_team_health_report(project_data: dict, team_members: list) -> dict:
    project_title = project_data.get("title", "Unknown Project")
    project_desc = project_data.get("description", "")
    req_roles = project_data.get("required_roles", [])
    
    member_details = []
    for m in team_members:
        skills = m.get("skills", {}).get("technical", [])
        role = m.get("preferences", {}).get("role_preference", "General")
        member_details.append(f"- Role: {role}, Skills: {', '.join(skills)}")

    prompt = f"""
    You are an expert technical project manager and AI team analyzer. 
    Analyze the following team's capability to successfully build their project.

    Project Name: {project_title}
    Description: {project_desc}
    Required Roles: {req_roles}

    Current Team Members:
    {chr(10).join(member_details)}

    Evaluate the team's health and return ONLY a raw JSON object (no markdown formatting, no code blocks) with the exact following keys:
    {{
        "score": (integer 0-100),
        "probability": (integer 0-100),
        "missing_roles": [(list of strings of roles they desperately need)],
        "missing_skills": [(list of strings of technical skills missing)],
        "risks": [(list of 2-3 short sentences about risk factors)],
        "recommendations": [(list of 2-3 short actionable recommendations)]
    }}
    """

    try:
        client = get_gemini_client()
        # Naya model aur naya syntax
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=prompt,
        )
        
        raw_text = response.text.strip()
        
        # Markdown backticks hatane ke liye clean up
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        health_data = json.loads(raw_text.strip())
        return health_data
    except Exception as e:
        print("Gemini API/Parsing error details:", str(e))
        return {
            "score": 0, "probability": 0, 
            "missing_roles": [], "missing_skills": [], 
            "risks": ["Analysis failed due to AI API error."], 
            "recommendations": ["Check backend logs or try again later."]
        }