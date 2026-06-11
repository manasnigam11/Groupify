# Groupify — AI-Powered Teammate Matching Agent

> **Google Cloud Rapid Agent Hackathon (MongoDB Track)**
>
> Groupify is an intelligent AI agent that helps hackathon participants find compatible teammates using Gemini AI analysis, MongoDB Atlas Vector Search, and multi-stage compatibility scoring.

---

## How It Works

```
User Query ──► Gemini Analyzes Query ──► MongoDB Vector Search ──► Gemini Scores Candidates ──► Results
                                              │
                                              ▼
                                     Fallback: Standard Query
```

### Core Agent Pipeline

1. **Profile Analysis** — User provides skills (with proficiency levels), role, interests, and project idea during onboarding
2. **Query Understanding** — Gemini parses natural language search queries into structured filters (skills, roles, interests)
3. **Semantic Search** — MongoDB Atlas Vector Search finds semantically similar profiles using Gemini Embeddings
4. **Compatibility Scoring** — Gemini evaluates each candidate on skill complementarity (40%), role fit (25%), interest alignment (20%), and project compatibility (15%)
5. **Explainable Results** — Every match includes an AI-generated explanation of why they're a good fit

### Three Matching Modes

| Mode | How It Works |
|------|-------------|
| **Search Mode** | Describe your ideal teammate: *"Find me a frontend developer who knows React and Figma"* |
| **Complete My Team** | AI analyzes your strengths, identifies missing roles & skills, and finds teammates to fill the gaps |
| **Find a Person** | Look up a specific user directly by their email address |

---

## Features

### Authentication & Onboarding
- **Email + OTP Verification** — Signup with email, receive a styled HTML OTP via SMTP, and verify before access
- **Google Sign-In** — One-click authentication with Google OAuth 2.0 (auto-verified)
- **Smart Redirects** — Automatically routes new users to onboarding if their profile is incomplete

### AI-Powered Matching
- **Gemini Query Analysis** — Natural language queries are parsed into structured search filters
- **MongoDB Atlas Vector Search** — Semantic search using 3072-dim Gemini embeddings with cosine similarity
- **Automatic Fallback** — Falls back to standard MongoDB queries when vector search returns < 3 results
- **Compatibility Scoring & Explanations** — AI-scored results with human-readable reasoning

### Project & Team Management
- **Create Projects** — Define your hackathon project with title, description, required skills, required roles, and team size
- **Team Invitations** — Send/receive team invites with custom messages; accept or decline with auto-join
- **AI Team Health Analysis** — Gemini analyzes your team composition and identifies missing roles, skill gaps, risks, and recommendations with a health score
- **AI Recommendations** — Get suggested teammates based on your project's required skills

### Communication
- **Direct Messages** — Real-time 1-on-1 chat with any user on the platform
- **Team Chat** — Project-level group messaging for team coordination

### Profile & Discovery
- **Public Profiles** — View other users' skills, role, interests, and project ideas
- **Dynamic Compatibility** — View AI-computed compatibility scores between you and any other user
- **Edit Profile** — Update skills, bio, university, links, and preferences at any time
- **Account Deletion** — Permanently delete your account with email confirmation (cleans up all related data)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 8 |
| **Backend** | FastAPI (Python 3.13) |
| **Database** | MongoDB Atlas (Motor async driver) |
| **AI** | Google Gemini 2.5 Flash (query analysis + scoring) |
| **Embeddings** | Gemini Embedding 001 (3072 dimensions) |
| **Search** | MongoDB Atlas Vector Search (cosine similarity) |
| **Auth** | JWT (python-jose) + bcrypt + Email OTP + Google OAuth 2.0 |
| **Email** | SMTP (Gmail) with styled HTML templates |
| **Deployment** | Docker + Google Cloud Run |

---

## Project Structure

```
Groupify/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, CORS, lifespan, route registration
│   │   ├── database.py            # MongoDB Atlas connection (Motor async driver)
│   │   ├── models.py              # Pydantic schemas (User, Project, Chat, Invite, Match, OTP)
│   │   ├── utils.py               # JWT + bcrypt password hashing + auth dependency
│   │   ├── seed.py                # 100 realistic seed profiles with optional embeddings
│   │   ├── routes/
│   │   │   ├── auth.py            # POST /signup, /verify-otp, /login, /google; GET /me
│   │   │   ├── profile.py         # GET/PUT /profile, GET /:id, /:id/compatibility, DELETE /delete-account
│   │   │   ├── match.py           # POST /find (3 modes), GET /history, /:id
│   │   │   ├── projects.py        # CRUD + /remove-member, /leave, /health/analyze
│   │   │   ├── chats.py           # DM + Team chat: GET/POST messages
│   │   │   ├── invites.py         # Send, list, accept/decline team invitations
│   │   │   └── recommendations.py # AI-powered teammate recommendations for projects
│   │   └── services/
│   │       ├── embeddings.py      # Gemini embedding generation (profile + query)
│   │       ├── gemini.py          # Query analysis + team gap analysis + scoring
│   │       ├── matching_engine.py # Core AI pipeline (vector search + fallback + scoring)
│   │       ├── ai_health.py       # Gemini-powered team health analysis
│   │       └── otp.py             # OTP generation + styled HTML email via SMTP
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
├── groupify/                       # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                 # Route definitions + auth guards + smart redirects
│   │   ├── main.jsx                # Entry point (BrowserRouter, GoogleOAuth, AuthProvider)
│   │   ├── index.css               # Design system (dark theme, CSS variables)
│   │   ├── context/AuthContext.jsx  # Auth state, login/signup/OTP/Google actions, notifications
│   │   ├── services/api.js         # API service layer (all backend endpoints)
│   │   ├── layouts/AppLayout.jsx   # TopNav + Outlet wrapper
│   │   ├── components/             # TopNav, BottomNav, TeamHealthCard, etc.
│   │   └── pages/
│   │       ├── LandingPage/        # Public landing page
│   │       ├── LoginScreen/        # Email + password login
│   │       ├── SignupScreen/       # Email signup + OTP verification
│   │       ├── OnboardingFlow/     # Skills, role, interests setup
│   │       ├── Dashboard/          # Profile summary, quick actions
│   │       ├── FindTeammates/      # Search, Complete My Team, Find a Person
│   │       ├── ProfileScreen/      # View own/others' profile + compatibility
│   │       ├── EditProfile/        # Edit skills, bio, preferences
│   │       ├── CreateProject/      # Create/edit hackathon projects
│   │       ├── MyTeamScreen/       # Team management + AI health analysis
│   │       └── ChatsScreen/        # DMs + team chat
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 18+
- MongoDB Atlas cluster (with Vector Search enabled)
- Google Gemini API key
- *(Optional)* Gmail SMTP credentials for OTP emails
- *(Optional)* Google Cloud Console OAuth client ID for Google Sign-In

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv && .venv\Scripts\activate   # Windows
# python -m venv .venv && source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Create a .env file with the variables listed below

# Seed database with 100 demo profiles
python -m app.seed                 # Without embeddings
python -m app.seed --embeddings    # With Gemini embeddings (recommended)

# Start server
uvicorn app.main:app --reload --port 8000
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
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=groupify

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Email OTP (optional — logs to console if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
OTP_EXPIRY_MINUTES=5

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
```

**Frontend (`groupify/.env`):**

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create account + send OTP email |
| `POST` | `/api/auth/verify-otp` | Verify OTP + return JWT |
| `POST` | `/api/auth/login` | Login (verified users only) |
| `POST` | `/api/auth/google` | Google OAuth sign-in |
| `GET` | `/api/auth/me` | Get current authenticated user |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profile` | Get own profile |
| `PUT` | `/api/profile` | Update profile + regenerate embedding |
| `GET` | `/api/profile/:id` | Get another user's public profile |
| `GET` | `/api/profile/:id/compatibility` | AI compatibility score with a user |
| `DELETE` | `/api/profile/delete-account` | Permanently delete account |

### AI Matching
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/match/find` | Run AI matching (standard / complete_my_team / find_a_person) |
| `GET` | `/api/match/history` | Past match requests |
| `GET` | `/api/match/:id` | Specific match result |

### Projects & Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/my` | Get user's current project |
| `POST` | `/api/projects` | Create a project |
| `PUT` | `/api/projects/:id` | Update a project |
| `POST` | `/api/projects/:id/remove-member` | Remove a team member |
| `POST` | `/api/projects/:id/leave` | Leave a team (or delete if owner) |
| `POST` | `/api/projects/:id/health/analyze` | Trigger AI team health analysis |
| `GET` | `/api/recommendations/:id` | AI teammate recommendations for a project |

### Team Invitations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/invites/:userId` | Send a team invitation |
| `GET` | `/api/invites` | Get sent and received invitations |
| `POST` | `/api/invites/:id/respond` | Accept or decline an invitation |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chats` | List DM conversations |
| `GET` | `/api/chats/:userId` | Get DM history with a user |
| `POST` | `/api/chats/:userId` | Send a direct message |
| `GET` | `/api/chats/team/:projectId` | Get team chat messages |
| `POST` | `/api/chats/team/:projectId` | Send a team chat message |

---

## MongoDB Setup

### Collections

| Collection | Purpose |
|-----------|---------|
| `users` | Profiles, skills, preferences, embedding vectors |
| `match_requests` | Query, mode, analysis, scored results |
| `projects` | Team projects with members, roles, health data |
| `team_invitations` | Sent/received invites with status |
| `chat_messages` | DMs and team chat messages |

### Required Indexes

The application auto-creates indexes on startup for `projects`. Run the seed script to create indexes on `users`.

### Vector Search Index

Create a vector search index named `user_embedding_index` on the `users` collection in MongoDB Atlas:

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
  --set-env-vars "MONGODB_URI=...,GEMINI_API_KEY=...,JWT_SECRET_KEY=...,GOOGLE_CLIENT_ID=..."
```

For the frontend, build and deploy as a static site:

```bash
cd groupify
npm run build
# Deploy the dist/ folder to any static hosting (Vercel, Netlify, Firebase Hosting, etc.)
```

---

## Team

Built by **Manas Nigam** for the **Google Cloud Rapid Agent Hackathon** (MongoDB Track)

---

## License

MIT
