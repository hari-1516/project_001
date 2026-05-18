from deepface import DeepFace
import cv2
from anti_spoof import check_liveness

def run_registration_pipeline(image_path: str):
    """
    Extract FaceNet embedding (512-d array for Facenet512)
    """
    print(f"Generating embedding for {image_path}...")
    try:
        liveness = check_liveness(image_path)
        # We use Facenet512 model as it provides high accuracy
        embedding_objs = DeepFace.represent(img_path=image_path, model_name="Facenet512", enforce_detection=True)
        if len(embedding_objs) == 0:
            return {"embedding": None, "liveness": liveness}
        # Return the embedding of the first detected face
        return {"embedding": embedding_objs[0]["embedding"], "liveness": liveness}
    except Exception as e:
        print(f"Error extracting embedding: {e}")
        return {"embedding": None, "liveness": {"is_live": False, "confidence": 0.0, "reason": str(e)}}
