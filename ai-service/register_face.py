from deepface import DeepFace
import cv2

def run_registration_pipeline(image_path: str):
    """
    Extract FaceNet embedding (512-d array for Facenet512)
    """
    print(f"Generating embedding for {image_path}...")
    try:
        # We use Facenet512 model as it provides high accuracy
        embedding_objs = DeepFace.represent(img_path=image_path, model_name="Facenet512", enforce_detection=True)
        if len(embedding_objs) == 0:
            return None
        # Return the embedding of the first detected face
        return embedding_objs[0]["embedding"]
    except Exception as e:
        print(f"Error extracting embedding: {e}")
        return None

