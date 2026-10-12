# MeetScribe — Meeting Notes & Transcription Platform

MeetScribe is a full-stack meeting notes and transcription platform that helps users organize meetings, search transcripts, review summaries, and manage action items in one workspace. It provides a centralized dashboard for reviewing meeting records, navigating timestamped transcripts, and tracking follow-up tasks.

## Live Demo

- **Frontend:** https://meetscribe-black.vercel.app/
- **Backend API:** https://meetscribe-api.vercel.app/
- **API Documentation:** https://meetscribe-api.vercel.app/docs
- **GitHub Repository:** https://github.com/snehakri12/meetscribe

## Features

- **Meeting Dashboard:** Browse, search, filter, and sort meeting records.
- **Meeting Details:** View meeting metadata, participants, duration, and topics.
- **Transcript Viewer:** Read timestamped transcript entries with speaker labels.
- **Transcript Search:** Search within transcripts and highlight matching text.
- **Audio Player:** Play sample audio and navigate using transcript timestamps.
- **Meeting Summaries:** View and edit meeting summaries.
- **Action Items:** Create, edit, complete, and delete tasks associated with meetings.
- **Meeting Management:** Create, edit, and delete meetings; update titles, participants, and transcripts.
- **Persistent Storage:** Store meeting and task data through a FastAPI backend using SQLAlchemy.
- **Export:** Export meeting details, summaries, transcripts, topics, and action items as a TXT file.
- **REST API:** Support CRUD operations for meetings and action items.

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios

### Backend
- Python
- FastAPI
- SQLAlchemy
- Uvicorn

### Database
- SQLite for local development by default
- Neon PostgreSQL for the deployed environment

### Deployment
- Vercel for the frontend and backend
- Neon for managed PostgreSQL storage

## Project Structure

```text
MeetScribe/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── api.ts
├── public/
│   └── audio/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── seed.py
├── package.json
└── README.md
```

The repository also includes configuration files for the frontend, backend deployment, and Git. Virtual environments, dependency directories, generated build files, local databases, and environment files should not be committed.

## Prerequisites

- Node.js and npm
- Python 3.12 or a compatible version
- Git

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/snehakri12/meetscribe.git
cd meetscribe
```

### 2. Set up the backend

Open a terminal in the project root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

For local development, the backend can use SQLite by default if no `DATABASE_URL` is configured.

If your backend configuration requires environment variables, create a `backend/.env` file and configure the appropriate database connection. For example, use a local SQLite URL for local development:

```env
DATABASE_URL=sqlite:///./fireflies.db
```

For a PostgreSQL deployment, configure `DATABASE_URL` in the hosting provider's environment variables with your Neon connection string. Do not commit credentials or `.env` files to GitHub.

Start the backend from the `backend` directory:

```powershell
uvicorn main:app --reload
```

The local API will be available at:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

### 3. Set up the frontend

Open a second terminal in the project root:

```bash
npm install
npm run dev
```

Open the application at:

http://localhost:3000

By default, the frontend API client uses `http://127.0.0.1:8000`. To use a different backend, configure `NEXT_PUBLIC_API_URL` in the frontend environment and restart the development server.

For production, this variable should point to the deployed backend API.

Keep both local development servers running while testing the application.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check backend health |
| GET | `/meetings` | Retrieve meetings |
| POST | `/meetings` | Create a meeting |
| GET | `/meetings/{meeting_id}` | Retrieve a meeting |
| PATCH | `/meetings/{meeting_id}` | Update meeting details |
| DELETE | `/meetings/{meeting_id}` | Delete a meeting |
| GET | `/tasks` | Retrieve action items |
| POST | `/tasks` | Create an action item |
| PATCH | `/tasks/{task_id}` | Update an action item |
| DELETE | `/tasks/{task_id}` | Delete an action item |

## Architecture Overview

MeetScribe uses a Next.js frontend to render the dashboard and handle user interactions. Axios communicates with the FastAPI backend through REST endpoints.

The backend uses SQLAlchemy models to interact with the configured database. Meeting and task data are persisted in the database, allowing the application to retrieve and update records through the API.

The frontend is configured to use a local API during development and a deployed API in production.

## Database Design

### Meetings

Meeting records include:
- Title
- Date and duration
- Participants
- Summary
- Transcript
- Topics

### Tasks

Action items include:
- Task title
- Completion status
- Associated meeting ID

Each task references its associated meeting through a foreign key.

## Assumptions and Limitations

- MeetScribe is an independent educational project inspired by meeting intelligence platforms. It is not an official Fireflies.ai product.
- SQLite is the default database for local development; the deployed application uses Neon PostgreSQL.
- Seeded meeting data demonstrates the meeting, summary, transcript, and task workflows.
- The audio player uses sample audio. The audio is not synchronized with the transcript's actual dialogue.
- Live meeting bots, real-time speech-to-text, external integrations, and production authentication are not implemented.
- Summaries are demonstration content rather than output from a live AI summarization service.
- The application requires correctly configured API URLs, CORS settings, and database connectivity for deployment.

## Future Improvements

- Integrate speech-to-text transcription.
- Add AI-generated summaries and meeting question answering.
- Implement authentication and team collaboration.
- Add transcript comments, highlights, and soundbites.
- Support additional export formats.
- Expand automated testing and error handling.

## License

Developed as an educational full-stack application.
