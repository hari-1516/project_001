import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from recognize_faces import run_recognition_pipeline
from register_face import run_registration_pipeline

app = FastAPI(title="VisionAttend AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "VisionAttend AI Service is running"}

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

    # Mocked Recognition Pipeline
    recognized_students = run_recognition_pipeline(file_path)

    # Clean up
    if os.path.exists(file_path):
        os.remove(file_path)

    return {"recognized_students": recognized_students}

@app.post("/register")
async def register(file: UploadFile = File(...)):
    """
    Receives an image for a new student and generates an embedding.
    """
    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Mocked Registration Pipeline
    embedding = run_registration_pipeline(file_path)

    # Clean up
    if os.path.exists(file_path):
        os.remove(file_path)

    return {"embedding": embedding}
