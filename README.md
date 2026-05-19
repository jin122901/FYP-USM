# FYP-USM — Student Course Feedback Analysis Platform

A full-stack web application for **Universiti Sains Malaysia (USM) Final Year Project (FYP)** that helps educators analyze student course feedback at scale. Users upload CSV files, select feedback columns, and receive automated **sentiment classification**, **topic clustering**, **AI-generated recommendations**, and interactive **dashboards** with exportable reports.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [User Roles & Routes](#user-roles--routes)
- [Analysis Pipeline](#analysis-pipeline)
- [Database Schema](#database-schema)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Features

### For educators (standard users)

- Register and log in with session-based authentication
- Upload **CSV** course feedback files with course name metadata
- Preview file columns and select which columns to analyze
- Background processing with progress tracking in the database
- View analysis results per upload:
  - Sentiment distribution (positive / neutral / negative)
  - Topic breakdown and sentiment-by-topic charts
  - Filterable feedback table
  - Word clouds (filterable by sentiment and topic)
  - AI-generated improvement recommendations from negative feedback
- Export analysis reports 
- Manage account profile and password

### For administrators

- User management dashboard (list, search, activate/deactivate accounts)
- Admin overview page with charts 

### Public

- Landing page, about page, login, and registration

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, Vite 6, React Router 7, Axios, Bootstrap 5, Recharts |
| **Backend** | Python, Flask, Flask-CORS, Flask-Session |
| **Database** | PostgreSQL (Supabase-compatible) |
| **ML / NLP** | Hugging Face Transformers (fine-tuned sentiment model), Sentence Transformers (`all-MiniLM-L6-v2`), scikit-learn KMeans, NLTK VADER, langdetect |
| **AI** | Google Gemini 2.0 Flash (topic naming & recommendations) |
| **Visualization** | WordCloud, Matplotlib (server-side word cloud images) |

---

## Project Structure

```
FYP-USM/
├── backend/
│   ├── app.py                 # Flask entry point, blueprint registration
│   ├── ml_model.py            # Loads sentiment pipeline at startup
│   ├── db/
│   │   └── dbconnect.py       # PostgreSQL connection
│   ├── model/
│   │   ├── user.py            # User CRUD
│   │   ├── file.py            # Uploaded file CRUD & status
│   │   └── fine_tuned_sentiment_model/   # Fine-tuned HF model (gitignored)
│   ├── routes/
│   │   ├── auth.py            # Register, login, logout, session, account
│   │   ├── user.py            # Admin user list & status
│   │   ├── uploadFile.py      # Upload, analysis, charts, word cloud
│   │   └── protectedroute.jsx # Frontend route guard (role check)
│   ├── uploads/               # Original & processed CSV files
│   └── flask_session/         # Server-side sessions (gitignored)
├── src/
│   ├── App.jsx                # React Router setup
│   ├── components/            # Charts, WordCloud, SessionProvider
│   └── pages/
│       ├── public/            # Home, Login, Register, About
│       ├── user/              # Dashboard, Upload, Results, Account
│       └── admin/             # Dashboard, User Management
├── package.json
├── vite.config.js             # Dev proxy: /api → localhost:5000
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ (3.11 recommended)
- **PostgreSQL** database (e.g. [Supabase](https://supabase.com))
- **Google Gemini API key** (for topic labels and recommendations)
- Sufficient disk/RAM for PyTorch and transformer models on first run

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/FYP-USM.git
cd FYP-USM
```

### 2. Frontend setup

```bash
npm install
```

### 3. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install flask flask-cors flask-session psycopg2-binary bcrypt pytz pandas \
  transformers torch sentence-transformers scikit-learn tqdm langdetect \
  google-generativeai nltk wordcloud matplotlib joblib werkzeug

python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('stopwords')"
```

> **Tip:** Pin versions in a `requirements.txt` for reproducible installs.

### 4. Machine learning models

The fine-tuned sentiment model lives under `backend/model/fine_tuned_sentiment_model/`. This folder is listed in `.gitignore`, so you must:

- Obtain the model weights from your project team / release assets, **or**
- Train and place your own fine-tuned model at that path

`ml_model.py` also references `model/textminig_model/kmeans_model.pkl` (optional legacy artifact; topic clustering in `uploadFile.py` uses live KMeans on BERT embeddings).

---

## Configuration

Create environment-based configuration instead of hardcoding secrets in source files.

### Database (`backend/db/dbconnect.py`)

Use environment variables:

| Variable | Description |
|----------|-------------|
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | Database host |
| `DB_PORT` | Port (default `5432`) |
| `DB_NAME` | Database name |

Example `.env` (load with `python-dotenv` or export manually):

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=your-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
```

### Gemini API (`backend/routes/uploadFile.py`)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Generative AI API key |

Replace hardcoded `genai.configure(api_key=...)` calls with `os.environ["GEMINI_API_KEY"]`.

### Flask session (`backend/app.py`)

| Setting | Default | Notes |
|---------|---------|-------|
| `secret_key` | hardcoded | Change for production |
| Session lifetime | 10 minutes | Matches `check_session` inactivity timeout |
| CORS origin | `http://localhost:5173` | Update for deployed frontend URL |

### Database tables

On first run, `create_users_table()` creates `user_info`. Ensure `uploaded_files` exists in PostgreSQL with columns used by `model/file.py` (`fileid`, `filename`, `file_path`, `coursename`, `user_id`, `statusprocess`, `suggestion`, `uploaded_at`, etc.).

---

## Running the Application

Open **two terminals** from the project root.

**Terminal 1 — Backend**

```bash
cd backend
# activate venv if not already active
python app.py
```

Flask runs at `http://localhost:5000`.

**Terminal 2 — Frontend**

```bash
npm run dev
```

Vite runs at `http://localhost:5173` and proxies `/api` requests to the Flask server.

### Production build (frontend only)

```bash
npm run build
npm run preview
```

Serve the `dist/` folder behind a static host and point API calls to your deployed Flask backend.

---

## User Roles & Routes

| Role | `usr_type` | Access |
|------|------------|--------|
| **Admin** | `0` | `/admin`, `/UserManagement` |
| **User** | `1` | `/user`, `/uploadPage`, `/Resultpage/:fileId`, `/account` |

| Route | Description |
|-------|-------------|
| `/` | Public home |
| `/login`, `/RegisterPage` | Authentication |
| `/about` | Platform overview |
| `/uploadPage` | Upload CSV & manage files |
| `/Resultpage/:fileId` | Analysis dashboard for one file |

Route protection uses `localStorage.user_type` (`ProtectedRoute`) plus Flask session cookies for API calls (`withCredentials: true`).

---

## Analysis Pipeline

When a user uploads a CSV with selected columns:

1. File is saved to `backend/uploads/` with a unique timestamped name.
2. A background thread starts analysis and updates `statusprocess` in the database (`10` → `90` → `100` or `failed`).
3. For each selected column:
   - Text is truncated to 512 characters.
   - Non-English rows are detected with `langdetect` and marked `N/A`.
   - **Sentiment** is predicted via the fine-tuned Transformers pipeline (`LABEL_0` negative, `LABEL_1` neutral, `LABEL_2` positive).
   - **Topics** are assigned via BERT embeddings → KMeans → Gemini-generated topic names.
4. Processed CSV is written as `processed_<filename>.csv`.
5. **Recommendations** are generated from all negative feedback using Gemini.
6. Frontend polls file status and loads charts via `/api/file/read-csv` and word clouds via `/api/file/wordcloud-image`.

---

## Database Schema

### `user_info`

| Column | Description |
|--------|-------------|
| `id` | Primary key |
| `name`, `email`, `password` | User credentials (bcrypt hash) |
| `industry` | User industry field |
| `usr_type` | `0` = admin, `1` = user |
| `status` | Account active state |

### `uploaded_files`

| Column | Description |
|--------|-------------|
| `fileid` | Primary key |
| `filename`, `file_path`, `coursename` | File metadata |
| `user_id` | Owner |
| `statusprocess` | Progress (`10`–`100`, `failed`) |
| `suggestion` | AI recommendation text |
| `uploaded_at` | Timestamp |

---

## Known Limitations

- Only **CSV** uploads are validated on upload (some helpers also support Excel).
- Analysis filters to **English** feedback only; other languages receive `N/A` for sentiment/topic.
- API keys and database credentials are **hardcoded** in some files — move to environment variables before publishing.
- Admin dashboard (`/api/admin/dashboard-stats`) is **not implemented**; the admin home page falls back to sample chart data.
- `change-password` route references `bcrypt.check_password_hash` while registration uses `bcrypt.checkpw` — verify password change flow before production use.
- Large models load at Flask startup; first request may be slow and memory-intensive.
- Session timeout is **10 minutes** of inactivity (Malaysia timezone for activity tracking).

---

## License

This project was developed as an academic Final Year Project at USM. Contact the repository owner for licensing and reuse terms.

---

## Acknowledgements

- [Hugging Face Transformers](https://huggingface.co/docs/transformers) — sentiment analysis
- [Sentence Transformers](https://www.sbert.net/) — semantic embeddings
- [Google Gemini](https://ai.google.dev/) — topic naming and recommendations
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) — frontend tooling
