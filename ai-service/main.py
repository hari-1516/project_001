import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from recognize_faces import run_recognition_pipeline
from register_face import run_registration_pipeline

app = FastAPI(title="VisionAttend AI Service")
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:5173").split(",")
    if origin.strip()
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "VisionAttend AI Service is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    """
    Receives an image and returns the list of recognized USNs/Student IDs.
    """
    # Create temp directory if it doesn't exist
    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    recognition = run_recognition_pipeline(file_path)

    # Clean up
    if os.path.exists(file_path):
        os.remove(file_path)

    return recognition

@app.post("/register")
async def register(file: UploadFile = File(...)):
    """
    Receives an image for a new student and generates an embedding.
    """
    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    registration = run_registration_pipeline(file_path)

    # Clean up
    if os.path.exists(file_path):
        os.remove(file_path)

    return registration
