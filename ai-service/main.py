import sys
import os
import uuid
import time
import aiofiles
from contextlib import asynccontextmanager
from collections import defaultdict
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

from auth import verify_api_key
from recognize_faces import run_recognition_pipeline
from register_face import run_registration_pipeline, run_multi_registration_pipeline


# Simple in-memory rate limiter
class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        self.requests[key] = [t for t in self.requests[key] if now - t < window_seconds]
        if len(self.requests[key]) >= max_requests:
            return False
        self.requests[key].append(now)
        return True

limiter = RateLimiter()


@asynccontextmanager
async def lifespan(app_instance):
    print("AI Service started - model will load on first request")
    yield


app = FastAPI(title="VisionAttend AI Service", lifespan=lifespan)
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "VisionAttend AI Service is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/recognize")
async def recognize(file: UploadFile = File(...), _: bool = Depends(verify_api_key)):
    client_ip = "default"
    if not limiter.is_allowed(client_ip, max_requests=30, window_seconds=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    os.makedirs("temp", exist_ok=True)
    ext = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    file_path = os.path.join("temp", f"{uuid.uuid4().hex}{ext}")

    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())

        recognition = run_recognition_pipeline(file_path)
        return recognition
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/register")
async def register(file: UploadFile = File(...), _: bool = Depends(verify_api_key)):
    client_ip = "default"
    if not limiter.is_allowed(client_ip, max_requests=20, window_seconds=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    os.makedirs("temp", exist_ok=True)
    ext = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    file_path = os.path.join("temp", f"{uuid.uuid4().hex}{ext}")

    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())

        registration = run_registration_pipeline(file_path)
        return registration
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@app.post("/register_multi")
async def register_multi(files: list[UploadFile] = File(...), _: bool = Depends(verify_api_key)):
    client_ip = "default"
    if not limiter.is_allowed(client_ip, max_requests=20, window_seconds=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed")

    os.makedirs("temp", exist_ok=True)
    file_paths = []

    try:
        for file in files:
            ext = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
            file_path = os.path.join("temp", f"{uuid.uuid4().hex}{ext}")
            async with aiofiles.open(file_path, "wb") as buffer:
                await buffer.write(await file.read())
            file_paths.append(file_path)

        registration = run_multi_registration_pipeline(file_paths)
        return registration
    finally:
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)
