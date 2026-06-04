# Groupify — AI-Powered Teammate Matching Agent

> **Google Cloud Rapid Agent Hackathon (MongoDB Track)**
>
> Groupify is an AI agent that helps hackathon participants find compatible teammates using Gemini AI analysis, MongoDB Atlas Vector Search, and intelligent compatibility scoring.

---

## Demo

| Dashboard | Find Teammates | Match Results |
|-----------|---------------|---------------|
| View your profile summary, skills, and project idea | Search using natural language or let AI analyze your gaps | AI-scored results with compatibility explanations |

---

## How It Works

```
User Query ──► Gemini Analyzes Query ──► MongoDB Vector Search ──► Gemini Scores Candidates ──► Results
                                              │
                                              ▼
                                     Fallback: Standard Query
```

### Core Agent Pipeline

1. **Profile Analysis** — User provides skills, role, interests, and project idea during onboarding
2. **Query Understanding** — Gemini parses natural language search queries into structured filters
3. **Semantic Search** — MongoDB Atlas Vector Search finds semantically similar profiles using Gemini embeddings
4. **Compatibility Scoring** — Gemini evaluates each candidate on skill complementarity, role fit, interest alignment, and project compatibility
5. **Explainable Results** — Every match includes an AI-generated explanation of why they're a good fit

### Two Matching Modes

- **Search Mode** — Describe your ideal teammate: *"Find me a frontend developer who knows React and Figma"*
- **Complete My Team** — AI analyzes your strengths, identifies missing roles, and finds teammates to fill the gaps

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Vite |
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB Atlas |
| **AI** | Google Gemini 2.5 Flash + Gemini Embedding |
| **Search** | MongoDB Atlas Vector Search |
| **Auth** | JWT + bcrypt |
| **Deployment** | Docker + Google Cloud Run |

---

## Project Structure

```
Groupify/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS + lifespan
│   │   ├── database.py          # MongoDB Atlas connection (Motor)
│   │   ├── models.py            # Pydantic schemas
│   │   ├── utils.py             # JWT + password hashing
│   │   ├── seed.py              # 100 realistic seed profiles
│   │   ├── routes/
│   │   │   ├── auth.py          # POST /signup, /login, GET /me
│   │   │   ├── profile.py       # GET/PUT /profile + auto-embed
│   │   │   └── match.py         # POST /find, GET /history, /:id
│   │   └── services/
│   │       ├── embeddings.py    # Gemini embedding generation
│   │       ├── gemini.py        # Query analysis + scoring
│   │       └── matching_engine.py # Core AI pipeline
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
├── groupify/                    # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css            # Design system
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js
│   │   ├── components/TopNav/
│   │   ├── layouts/AppLayout.jsx
│   │   └── pages/
│   │       ├── SplashScreen/
│   │       ├── LoginScreen/
│   │       ├── SignupScreen/
│   │       ├── OnboardingFlow/
│   │       ├── Dashboard/
│   │       ├── FindTeammates/
│   │       └── ProfileScreen/
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 18+
- MongoDB Atlas cluster
- Google Gemini API key

### Backend Setup

```bash
cd backend

# Create virtual environment (optional)
python -m venv .venv && .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and Gemini API key

# Seed database with 100 demo profiles
python -m app.seed --embeddings

# Start server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd groupify

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Environment Variables

**Backend (`backend/.env`):**

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=groupify
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
GEMINI_API_KEY=your-gemini-api-key
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/profile` | Get profile |
| `PUT` | `/api/profile` | Update profile + regenerate embedding |
| `POST` | `/api/match/find` | Run AI matching pipeline |
| `GET` | `/api/match/history` | Past match requests |
| `GET` | `/api/match/:id` | Specific match result |

---

## MongoDB Collections

### `users`
- Profile, skills, preferences, embedding vector
- Indexed on: `email` (unique), `skills.technical`, `preferences.role_preference`, `is_looking`

### `match_requests`
- Query, mode, analysis, scored results, timestamps
- Indexed on: `user_id`, `created_at`

### Vector Search Index

Create a vector search index named `user_embedding_index` on the `users` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 3072,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "is_looking"
    }
  ]
}
```

---

## Deployment (Google Cloud Run)

```bash
cd backend

# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/groupify-api

# Deploy to Cloud Run
gcloud run deploy groupify-api \
  --image gcr.io/YOUR_PROJECT_ID/groupify-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "MONGODB_URI=...,GEMINI_API_KEY=...,JWT_SECRET_KEY=..."
```

---

## Team

Built for the **Google Cloud Rapid Agent Hackathon** (MongoDB Track)

---

## License

MIT
