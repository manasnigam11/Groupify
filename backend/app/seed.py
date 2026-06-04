"""
Groupify — Seed Data Generator.

Generates 100 realistic hackathon participant profiles and inserts them
into MongoDB. Optionally generates Gemini embeddings for each profile.

Usage:
    python -m app.seed                # Seed without embeddings
    python -m app.seed --embeddings   # Seed with embeddings (requires GEMINI_API_KEY)
"""

import asyncio
import random
import sys
from datetime import datetime, timezone

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os

load_dotenv()

# ---------------------------------------------------------------------------
# Profile Data Pools
# ---------------------------------------------------------------------------

FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Jamie", "Quinn", "Riley",
    "Avery", "Parker", "Blake", "Drew", "Sage", "Reese", "Emery", "Rowan",
    "Skyler", "Hayden", "Dakota", "Cameron", "Finley", "Harper", "Peyton",
    "Kendall", "Charlie", "Nico", "Kai", "Luna", "Aria", "Zara", "Mila",
    "Leo", "Ethan", "Noah", "Liam", "Oliver", "James", "Lucas", "Mason",
    "Aiden", "Sophia", "Emma", "Ava", "Isabella", "Mia", "Charlotte",
    "Amelia", "Elijah", "Sebastian", "Benjamin",
]

LAST_NAMES = [
    "Chen", "Patel", "Kim", "Singh", "Park", "Nguyen", "Anderson", "Williams",
    "Garcia", "Martinez", "Robinson", "Clark", "Lewis", "Walker", "Hall",
    "Young", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker",
    "Rivera", "Campbell", "Mitchell", "Roberts", "Carter", "Phillips", "Evans",
    "Turner", "Torres", "Parker", "Collins", "Edwards", "Stewart", "Flores",
    "Morris", "Nguyen", "Murphy", "Rivera", "Cook", "Rogers", "Morgan",
    "Peterson", "Cooper", "Reed", "Bailey", "Bell", "Gomez",
]

UNIVERSITIES = [
    "MIT", "Stanford University", "UC Berkeley", "Carnegie Mellon",
    "Georgia Tech", "University of Michigan", "UIUC", "University of Washington",
    "Caltech", "Cornell University", "UT Austin", "Purdue University",
    "UCLA", "UC San Diego", "NYU", "Columbia University",
    "University of Toronto", "IIT Delhi", "IIT Bombay", "NUS Singapore",
    "ETH Zurich", "Imperial College London", "University of Waterloo",
    "Duke University", "Rice University", "Brown University",
]

YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate", "PhD"]

ROLES = [
    "Frontend Developer", "Backend Developer", "Full-Stack Developer",
    "AI/ML Engineer", "UI/UX Designer", "Mobile Developer",
    "Product Manager", "Data Scientist", "DevOps Engineer",
]

SKILL_POOLS = {
    "Frontend Developer": ["JavaScript", "TypeScript", "React", "Vue", "Angular", "Next.js", "Svelte", "Tailwind CSS", "Material UI", "HTML", "CSS", "Figma"],
    "Backend Developer": ["Python", "Node.js", "FastAPI", "Django", "Express", "Java", "Spring Boot", "Go", "Rust", "PostgreSQL", "MongoDB", "Redis", "GraphQL", "REST APIs"],
    "Full-Stack Developer": ["JavaScript", "TypeScript", "React", "Node.js", "Python", "FastAPI", "MongoDB", "PostgreSQL", "Docker", "Git", "REST APIs", "Next.js"],
    "AI/ML Engineer": ["Python", "TensorFlow", "PyTorch", "Scikit-Learn", "LangChain", "Gemini API", "Hugging Face", "Pandas", "NumPy", "OpenAI API", "RAG", "Vector Databases"],
    "UI/UX Designer": ["Figma", "Adobe XD", "Sketch", "Tailwind CSS", "Material UI", "Prototyping", "User Research", "Wireframing", "Design Systems", "CSS"],
    "Mobile Developer": ["Flutter", "React Native", "Swift", "Kotlin", "Dart", "Firebase", "iOS", "Android", "Expo"],
    "Product Manager": ["Agile", "Scrum", "Jira", "Product Strategy", "User Research", "Roadmapping", "Data Analysis", "A/B Testing"],
    "Data Scientist": ["Python", "R", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow", "SQL", "Tableau", "Statistics", "Jupyter"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "Terraform", "CI/CD", "Linux", "Monitoring", "Git"],
}

INTERESTS = [
    "AI/ML", "HealthTech", "FinTech", "EdTech", "CleanTech",
    "Gaming", "Social Impact", "Web3", "DevTools", "Cybersecurity",
    "IoT", "AR/VR", "E-Commerce", "Open Source", "Accessibility",
]

PROJECT_IDEAS = [
    "An AI-powered mental health chatbot that provides real-time cognitive behavioral therapy techniques",
    "A smart study planner that uses ML to optimize learning schedules based on retention patterns",
    "An AR navigation app for campus buildings that helps new students find classrooms",
    "A peer-to-peer tutoring marketplace with skill verification and rating systems",
    "An AI code review assistant that provides actionable feedback for junior developers",
    "A carbon footprint tracker that gamifies sustainable living choices",
    "A real-time sign language translator using computer vision and NLP",
    "An automated resume builder that tailors content to specific job descriptions using AI",
    "A community emergency response coordination platform for natural disasters",
    "A smart grocery list app that suggests recipes based on expiring ingredients",
    "An AI-powered music composition tool for indie game developers",
    "A decentralized voting system for student government elections",
    "An accessibility-first news reader with multi-modal content consumption",
    "A real-time collaboration tool for remote hackathon teams with pair programming",
    "An AI homework helper that explains concepts step-by-step without giving answers",
    "A smart traffic management system using IoT sensors and predictive modeling",
    "A personalized fitness coaching app using pose estimation and ML",
    "An AI-driven matchmaker for research collaboration between universities",
    "A fake news detection browser extension using NLP and fact-checking APIs",
    "A blockchain-based certificate verification system for educational institutions",
    "An AI-powered customer support bot builder with no-code interface",
    "A real-time pollution monitoring dashboard using satellite and IoT data",
    "An inclusive job board with AI-powered bias detection in job descriptions",
    "A smart scheduling assistant that finds optimal meeting times across time zones",
    "An AI-powered documentation generator that creates API docs from codebases",
    "A gamified cybersecurity awareness training platform for non-technical employees",
    "A telemedicine platform with AI triage and symptom analysis",
    "An AI-powered financial literacy app for college students",
    "A collaborative whiteboard with AI-powered diagram suggestions",
    "A privacy-first social media analytics tool for content creators",
]

BIOS = [
    "Passionate about building tools that make developers' lives easier.",
    "Love solving complex problems with elegant code. Coffee enthusiast.",
    "Aspiring ML engineer with a focus on NLP and conversational AI.",
    "Full-stack developer who enjoys creating beautiful user experiences.",
    "Hackathon veteran — 5 wins in the last 2 years. Always ready to build.",
    "Interested in the intersection of technology and social good.",
    "Former startup intern. Love shipping products fast.",
    "Design thinker who codes. Building delightful interfaces is my passion.",
    "Open source contributor and community builder.",
    "Data nerd who loves turning messy datasets into actionable insights.",
    "Mobile developer who believes in cross-platform first.",
    "Cloud infrastructure enthusiast. Everything should be containerized.",
    "Building AI agents that actually solve real problems.",
    "Competitive programmer turned product builder.",
    "Research assistant focusing on computer vision and generative AI.",
]

TIMEZONES = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Singapore",
    "Asia/Tokyo", "Australia/Sydney", "America/Toronto",
]


def generate_profile(index: int) -> dict:
    """Generate a single realistic user profile."""
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    name = f"{first} {last}"
    role = random.choice(ROLES)

    # Select 3-7 skills from the role's pool, plus 0-2 from other pools
    primary_skills = random.sample(
        SKILL_POOLS[role],
        k=min(random.randint(3, 6), len(SKILL_POOLS[role])),
    )
    other_role = random.choice([r for r in ROLES if r != role])
    bonus_skills = random.sample(
        SKILL_POOLS[other_role],
        k=min(random.randint(0, 2), len(SKILL_POOLS[other_role])),
    )
    all_skills = list(dict.fromkeys(primary_skills + bonus_skills))  # dedupe

    # Proficiency
    levels = ["beginner", "intermediate", "advanced", "expert"]
    proficiency = {}
    for s in all_skills:
        proficiency[s] = random.choice(levels)

    # Interests (2-5)
    interests = random.sample(INTERESTS, k=random.randint(2, 5))

    # Password hash
    pwd = bcrypt.hashpw(f"demo{index}".encode("utf-8"), bcrypt.gensalt())

    return {
        "email": f"seed{index}@groupify.demo",
        "password_hash": pwd.decode("utf-8"),
        "profile": {
            "name": name,
            "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={first}{last}{index}",
            "university": random.choice(UNIVERSITIES),
            "year": random.choice(YEARS),
            "bio": random.choice(BIOS),
            "github_url": f"https://github.com/{first.lower()}{last.lower()}{index}",
            "linkedin_url": "",
        },
        "skills": {
            "technical": all_skills,
            "proficiency": proficiency,
        },
        "preferences": {
            "hackathon_interests": interests,
            "project_idea": random.choice(PROJECT_IDEAS),
            "role_preference": role,
            "looking_for_roles": random.sample(
                [r for r in ROLES if r != role],
                k=random.randint(1, 3),
            ),
            "availability": random.choice(["full-time", "part-time", "weekends"]),
            "timezone": random.choice(TIMEZONES),
        },
        "is_looking": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


async def seed(with_embeddings: bool = False):
    """Generate and insert 100 profiles into MongoDB."""
    uri = os.getenv("MONGODB_URI", "")
    db_name = os.getenv("MONGODB_DB_NAME", "groupify")

    client = AsyncIOMotorClient(uri)
    db = client[db_name]

    # Clear existing seed data
    delete_result = await db.users.delete_many({"email": {"$regex": r"^seed\d+@groupify\.demo$"}})
    print(f"[CLEAN] Removed {delete_result.deleted_count} old seed profiles")

    profiles = [generate_profile(i) for i in range(1, 101)]

    if with_embeddings:
        print("[EMBED] Generating embeddings for 100 profiles (this may take a minute)...")
        from app.services.embeddings import generate_embedding
        for i, p in enumerate(profiles):
            try:
                p["embedding"] = await generate_embedding(p)
                print(f"  [{i+1}/100] Embedded: {p['profile']['name']}")
            except Exception as e:
                print(f"  [{i+1}/100] FAILED: {p['profile']['name']} — {e}")

    result = await db.users.insert_many(profiles)
    print(f"[OK] Inserted {len(result.inserted_ids)} seed profiles")

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("skills.technical")
    await db.users.create_index("preferences.role_preference")
    await db.users.create_index("preferences.hackathon_interests")
    await db.users.create_index("is_looking")
    print("[OK] Database indexes created")

    client.close()
    print("[DONE] Seeding complete!")


if __name__ == "__main__":
    use_embeddings = "--embeddings" in sys.argv
    asyncio.run(seed(with_embeddings=use_embeddings))
