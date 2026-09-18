# Civic Connect 🏛️

**AI-Based Government Service Query Understanding and Guidance Platform**

Civic Connect is an intelligent hyper-local civic issue reporting and municipal governance platform. Citizens report civic issues (roads, garbage, water, electricity, drainage) tied to their exact location, view a social community feed scoped to their ward, upvote neighborhood complaints to boost priority, and chat with an AI Guidance Assistant (*Civic Sahayak*) for step-by-step guidance on municipal services in English, Tamil, and Tanglish. Municipal officials access a dedicated jurisdiction-scoped dashboard to track issues, update statuses with real-time notes, and analyze resolution efficiency.

---

## 🌟 Key Features

### 1. Citizen Experience
- **Cascading Jurisdiction Selection**: Onboarded to designated State → District → Municipal Corporation → Ward (e.g. *Greater Chennai Corporation* → *Ward 104 - Anna Nagar West*).
- **Hyper-Local Community Feed**: Instagram-style civic stream showing complaints only from the citizen's active ward, sortable by **Newest First**, **Most Upvoted**, or **Highest Severity**.
- **Photo Evidence & Location**: Upload photos or choose high-res presets; auto-captures GPS coordinates with an interactive Leaflet.js pin-drop fallback map.
- **AI Auto-Classification (NLU Engine)**:
  - Automatically identifies **Category** (*Road, Water, Electricity, Garbage, Drainage, Other*).
  - Routes directly to the responsible **Municipal Department** (e.g. *Roads & Bridges Department*, *Solid Waste Management*).
  - Assesses **Severity** (*Low, Medium, High*).
  - Supports English, Tamil script, and Tanglish/colloquial phrasing (e.g., *"Inga 4th Avenue junction la periya pothole irukku, bikes skid aaguthu"*).
- **Proactive ~50m Duplicate Detection**:
  - Automatically checks active complaints within a ~50-meter radius using spatial distance + text similarity.
  - Urges citizens to **"Upvote That Issue Instead"** to prevent fragmented duplicate complaints.
- **"Me Too" / Upvote Engine**: One-click upvote to amplify community urgency.
- **Real-Time Status Tracking**: Dynamic visual progress (*Received* → *In Progress* → *Resolved*) with official action notes published by the municipal engineers.
- **Civic Sahayak AI (Guidance Chatbot)**:
  - Natural language chatbot answering citizen questions on municipal services.
  - Comprehensive knowledge base covering:
    - Property Tax online payment, calculations & rebate incentives
    - New Drinking Water & Sewerage connections (CMWSSB / TWAD)
    - Birth & Death Certificates online registration and PDF download (crstn.org)
    - D&O Trade License applications and renewals
    - Street light repair complaints & emergency helplines (1913, Minnagam)
  - Full conversational support for Tamil, Tanglish, and English.

### 2. Municipality Official / Admin Portal
- **Jurisdiction-Scoped Access**: Scoped to the official's assigned corporation (e.g. *Greater Chennai Corporation* or *Coimbatore City Municipal Corporation*).
- **Comprehensive Issue Management**:
  - Filter by Department, Category, Severity, Ward, and Status.
  - Interactive Table View, Card Stream, and GIS Map View.
  - Inspection of citizen contact info, location coordinates, and upvote priority.
- **Real-Time Status & Notes Publishing**:
  - Update complaint status (*Received* → *In Progress* → *Resolved*).
  - Add official action notes (e.g. *"Patchwork crew dispatched with cold-mix asphalt"*).
- **Civic Analytics**:
  - Real-time KPI counters (Total, Open, In Progress, Resolved).
  - Open vs Resolved breakdown per civic category.
  - Ward-level grievance volume distribution.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React, Tailwind CSS (modern tokens & glassmorphism), Lucide React, Leaflet.js (OpenStreetMap tiles).
- **Backend**: Node.js + Express REST API.
- **Auth**: Phone number + Mock OTP (`123456`) issuing JWT sessions.
- **Database Layer**:
  - **PostgreSQL + PostGIS**: Full PostGIS support with `GEOMETRY(Point, 4326)` and `ST_DWithin` spatial queries when `DATABASE_URL` is provided.
  - **Embedded Zero-Config Fallback**: Built-in high-performance `node:sqlite` database with native Haversine spatial math so the entire platform runs out-of-the-box on any machine without installing database daemons.
- **AI & NLU Engine**:
  - Supports Google Gemini API via `GEMINI_API_KEY` or Anthropic Claude.
  - Intelligent built-in rule-based & semantic multilingual NLU engine covering English, Tamil, and Tanglish phrases.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
# Or node src/server.js
```
The server will start on `http://localhost:5001`. On first run, it automatically seeds 2 Municipalities, 6 Wards, Departments, Users, and realistic community complaints.

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
The web client will start on `http://localhost:5173`.

---

## 🔐 Demo Credentials (Mock OTP: `123456`)

The app includes 1-click preset login buttons on the login modal:

| Role | Name | Phone Number | Scope |
|---|---|---|---|
| **Citizen** | Karthikeyan S. | `9999999999` | GCC: Ward 104 - Anna Nagar West |
| **Citizen** | Priya Raman | `9888888888` | GCC: Ward 117 - T. Nagar |
| **Citizen** | Ananya S. | `9777777777` | Coimbatore: Ward 23 - R.S. Puram |
| **Official** | Rajesh Kumar (Zonal Officer) | `9876543210` | Greater Chennai Corporation (GCC) |
| **Official** | Meena Sundaram (Commissioner) | `9876543211` | Coimbatore City Municipal Corporation |

*Any mobile phone number can also be used; simply enter OTP `123456`.*

---

## ⚙️ Environment Variables

Copy `server/.env.example` to `server/.env`:

```env
# Server Port
PORT=5001

# JWT Secret
JWT_SECRET=civic_connect_super_secret_jwt_key_2025

# Optional: PostgreSQL Database URL with PostGIS
# If commented out, the app uses the built-in zero-config SQLite spatial engine
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/civic_connect

# Optional: Google Gemini API Key
# If omitted, the app uses its offline high-accuracy multilingual NLU pipeline
# GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📁 Directory Structure

```
civic-connect/
├── client/                      # React + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIChatbotView.jsx        # Civic guidance chatbot
│   │   │   ├── AuthModal.jsx            # Phone + mock OTP login
│   │   │   ├── BottomNav.jsx            # Mobile responsive navigation
│   │   │   ├── CreatePostModal.jsx      # GPS pin drop, AI classification & duplicate prompt
│   │   │   ├── FeedView.jsx             # Ward-scoped civic feed
│   │   │   ├── Header.jsx               # Header with ward & role switcher
│   │   │   ├── LeafletMapView.jsx       # Interactive OpenStreetMap
│   │   │   ├── LocationSelectorModal.jsx# Cascading State->District->Muni->Ward selector
│   │   │   ├── OfficialDashboard.jsx    # Municipality admin dashboard & analytics
│   │   │   └── PostCard.jsx             # Social card with status timeline & upvotes
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Auth state & preset accounts
│   │   └── services/
│   │       └── api.js                   # REST API client
│   └── vite.config.js
└── server/                      # Express REST API backend
    ├── src/
    │   ├── controllers/         # Auth, posts, official, locations, chatbot
    │   ├── db/
    │   │   ├── db.js            # Unified DB abstraction (PostgreSQL/PostGIS + SQLite)
    │   │   └── seed.js          # Seed script with 2 Corporations & 6 Wards
    │   ├── middleware/          # JWT auth & Multer photo upload
    │   ├── routes/              # Express route definitions
    │   ├── services/
    │   │   └── aiService.js     # NLU classification, duplicate check, chatbot
    │   ├── app.js
    │   └── server.js
    └── uploads/                 # Statically served photo uploads
```
