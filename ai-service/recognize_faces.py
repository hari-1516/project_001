from deepface import DeepFace
import numpy as np
from database import load_all_embeddings
from scipy.spatial.distance import cosine
from anti_spoof import check_liveness

# Threshold for Facenet512 cosine similarity
THRESHOLD = 0.30

def run_recognition_pipeline(image_path: str):
    """
    1. Detect faces and get embeddings for all faces in the uploaded classroom image
    2. Fetch database embeddings and find cosine similarity
    3. Return matched USNs
    """
    print(f"Running recognition on {image_path}...")
    recognized_usns = set()
    unknown_faces = 0
    total_faces = 0
    liveness = check_liveness(image_path)
    
    try:
        # Detect all faces in the classroom image
        detected_faces = DeepFace.represent(img_path=image_path, model_name="Facenet512", enforce_detection=False)
        
        # Load known student embeddings from MongoDB
        known_students = load_all_embeddings()
        
        total_faces = len(detected_faces)
        if not known_students or total_faces == 0:
            return {
                "recognized_students": [],
                "total_faces": total_faces,
                "unknown_faces": total_faces,
                "liveness": liveness
            }

        # Compare each detected face against known students
        for face in detected_faces:
            face_emb = face["embedding"]
            best_match_usn = None
            best_distance = float('inf')

            for student in known_students:
                student_emb = student["embedding"]
                # Calculate cosine distance
                distance = cosine(face_emb, student_emb)
                
                if distance < best_distance:
                    best_distance = distance
                    best_match_usn = student["usn"]
            
            # If the best match is below the threshold, consider it recognized
            if best_distance < THRESHOLD and best_match_usn:
                recognized_usns.add(best_match_usn)
            else:
                unknown_faces += 1
                
    except Exception as e:
        import traceback
        error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"Recognition Error: {error_msg}")
        traceback.print_exc()
        return {
            "recognized_students": [],
            "total_faces": 0,
            "unknown_faces": 0,
            "liveness": liveness,
            "error": error_msg
        }
        
    return {
        "recognized_students": list(recognized_usns),
        "total_faces": total_faces,
        "unknown_faces": unknown_faces,
        "liveness": liveness
    }
