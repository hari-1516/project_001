# VisionAttend AI

VisionAttend AI is a smart attendance system with a React frontend, an Express/MongoDB API, and a FastAPI face-recognition service powered by DeepFace.

## Project Structure

```text
client/      React + Vite frontend
server/      Express API, MongoDB models, auth, attendance, reports
ai-service/  FastAPI service for face registration and recognition
```

## Prerequisites

- Node.js and npm
- Python 3.10+
- MongoDB or MongoDB Atlas

## Environment Setup

Create local env files from the examples:

```bash
copy server\.env.example server\.env
copy ai-service\.env.example ai-service\.env
copy client\.env.example client\.env
```

Update `MONGO_URI` and `JWT_SECRET` before running the backend.

## Run Locally

Start the backend API:

```bash
cd server
npm start
```

Start the frontend:

```bash
cd client
npm run dev
```

Start the AI service:

```bash
cd ai-service
uvicorn main:app --reload --port 8001
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- AI service: `http://localhost:8001`

## Verification

```bash
cd client
npm run lint
npm run build
```

```bash
cd server
npm test
```

```bash
python -m py_compile ai-service\main.py ai-service\register_face.py ai-service\recognize_faces.py ai-service\database.py
```

## Notes

- Do not commit `.env`, `node_modules`, uploads, temp files, or Python cache files.
- The backend and AI service expose `/health` endpoints for readiness checks.
- In production, `JWT_SECRET` must be set. The development fallback is intentionally blocked in production.
- Attendance supports both image upload and live webcam capture.
- The AI response includes detected faces, unknown faces, and a liveness heuristic.
- Admin users can manage account roles from the Admin panel.
- Notification records are created for offline AI, unknown faces, and possible spoof attempts.
- Email, SMS, and cloud storage require provider credentials and can be connected through the existing env/config pattern.
