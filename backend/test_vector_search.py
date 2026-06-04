"""Test Vector Search end-to-end."""
import requests

BASE = "http://localhost:8000"

# Step 1: Create fresh test user, then login
print("=" * 60)
print("[TEST] Creating test user vectortest2@test.com...")
r = requests.post(f"{BASE}/api/auth/signup", json={
    "email": "vectortest2@test.com",
    "password": "test1234",
    "name": "Vector Test",
})
if r.status_code == 201:
    token = r.json()["access_token"]
    print("[TEST] Signup OK")
elif r.status_code == 400:
    print("[TEST] User exists, logging in...")
    r = requests.post(f"{BASE}/api/auth/login", json={
        "email": "vectortest2@test.com",
        "password": "test1234",
    })
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} {r.text}")
        exit(1)
    token = r.json()["access_token"]
else:
    print(f"Signup failed: {r.status_code} {r.text}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Set up profile with nested objects matching the Pydantic schemas
print("[TEST] Setting up profile...")
r = requests.put(f"{BASE}/api/profile", json={
    "profile": {
        "name": "Vector Test"
    },
    "skills": {
        "technical": ["Python", "FastAPI", "MongoDB"]
    },
    "preferences": {
        "role_preference": "Backend Developer",
        "hackathon_interests": ["AI/ML"],
        "project_idea": "AI-powered teammate finder"
    }
}, headers=headers)
print(f"  Profile update status: {r.status_code}")

# Step 2: Run matching query
print("=" * 60)
query = "Find me a frontend developer who knows React and TypeScript"
print(f"[TEST] Query: '{query}'")
print("[TEST] Check backend logs for [VECTOR SEARCH] and [PIPELINE] output...")
print("=" * 60)

r2 = requests.post(f"{BASE}/api/match/find", json={
    "query": query,
    "mode": "standard",
}, headers=headers, timeout=120)

print(f"\n[RESULT] HTTP Status: {r2.status_code}")

if r2.status_code != 200:
    print(f"[ERROR] Response: {r2.text}")
    exit(1)

data = r2.json()

fallback = data.get("fallback_triggered", "UNKNOWN")
results = data.get("results", [])

print(f"[RESULT] fallback_triggered: {fallback}")
print(f"[RESULT] Results count: {len(results)}")

for i, m in enumerate(results):
    name = m.get("name", "?")
    score = m.get("compatibility_score", "?")
    reasoning = (m.get("reasoning", "") or "")[:80]
    print(f"  #{i+1} {name} — score={score}")
    print(f"       {reasoning}...")

print("=" * 60)
if fallback is False:
    print("[VERDICT] VECTOR SEARCH IS ACTIVE — Fallback was NOT triggered")
elif fallback is True:
    print("[VERDICT] FALLBACK WAS TRIGGERED — Check backend logs for details")
else:
    print("[VERDICT] Could not determine search mode")
print("=" * 60)
