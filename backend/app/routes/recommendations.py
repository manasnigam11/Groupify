from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
# Tumhara standard database dependency import
from app.database import get_database

router = APIRouter(prefix="/api/recommendations", tags=["AI Recommendations"])

@router.get("/{project_id}")
async def get_genuine_ai_recommendations(project_id: str, db=Depends(get_database)):
    try:
        # 1. Database se Project fetch karo taaki requirements pata chalein
        project = await db["projects"].find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        required_skills = project.get("required_skills", [])
        # Jo log pehle se team me hain unki IDs nikaal lo taaki unhe wapas recommend na kare
        current_members = [str(m.get("user_id")) for m in project.get("members", []) if m.get("user_id")]
        
        # Agar project me koi skill hi required nahi hai, toh empty list bhej do
        if not required_skills:
            return []

        # 2. Database se wo Users dhoondho jinki skills required skills se match karti hain
        # ($in operator overlap check karta hai, aur $nin existing members ko hatata hai)
        query = {
            "_id": {"$nin": [ObjectId(uid) for uid in current_members if ObjectId.is_valid(uid)]},
            "skills.technical": {"$in": required_skills} # Tumhare data structure ke hisaab se technical skills
        }
        
        # Top 20 matching profiles utha lo database se
        matching_users = await db["users"].find(query).to_list(length=20)
        
        # 3. Match Score Calculate karo har user ka
        recommendations = []
        for user in matching_users:
            # User ki skills fetch karo
            user_skills = user.get("skills", {}).get("technical", [])
            
            # Intersection nikaalo (kitni required skills user ko aati hain)
            matched_skills = set(required_skills).intersection(set(user_skills))
            
            # Percentage calculate karo
            match_percentage = int((len(matched_skills) / len(required_skills)) * 100) if required_skills else 0
            
            # Basic info extract karo
            name = user.get("profile", {}).get("name", "Groupify User")
            role = user.get("preferences", {}).get("role_preference", "Tech Specialist")

            recommendations.append({
                "id": str(user["_id"]),
                "name": name,
                "role": role,
                "score": match_percentage,
                "matched_skills": list(matched_skills)
            })

        # 4. Jinka score sabse high hai, unko list me upar rakho
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        # Top 4 recommendations frontend ko bhej do
        return recommendations[:10]

    except Exception as e:
        print("Backend Error in Recommendations:", str(e))
        raise HTTPException(status_code=500, detail="Failed to generate genuine AI recommendations")