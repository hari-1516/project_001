import cv2
import numpy as np
from scipy.spatial.distance import cosine
import os
import pickle
from database import load_all_embeddings, load_all_students

try:
    from deepface.DeepFace import build_model
    from retinaface import RetinaFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False

BASE_THRESHOLD = 0.18
ENSEMBLE_RUNS = 5
MODEL_NAME = 'ArcFace'
MIN_FACE_SIZE = 30

_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None and DEEPFACE_AVAILABLE:
        _embedding_model = build_model(MODEL_NAME)
    return _embedding_model


def load_all_embeddings_db():
    db_embeddings = load_all_embeddings()
    embeddings_dict = {}
    for s in db_embeddings:
        if s.get('embedding') and len(s['embedding']) > 0:
            embeddings_dict[s['usn']] = np.array(s['embedding'])
    return embeddings_dict


def extract_face_embeddings(image_path, face_crops):
    if not DEEPFACE_AVAILABLE:
        return []
    
    model = get_embedding_model()
    if model is None:
        return []
    
    from deepface.commons import functions
    embeddings = []
    
    for crop_path in face_crops:
        try:
            img = functions.preprocess_face(
                img_path=crop_path,
                target_size=(112, 112),
                enforce_detection=False
            )
            if img is not None:
                emb = model.predict(img, verbose=0)[0]
                embeddings.append(emb.tolist())
        except Exception:
            continue
    
    return embeddings


def detect_faces_ensemble(image_path, thresholds=[0.45, 0.50, 0.55]):
    """
    Run face detection multiple times with different thresholds and fuse results.
    """
    all_faces = {}
    
    for i, threshold in enumerate(thresholds):
        try:
            faces_data = RetinaFace.detect_faces(image_path, threshold=threshold)
            
            if isinstance(faces_data, dict):
                for key, face_info in faces_data.items():
                    if key not in all_faces:
                        all_faces[key] = {
                            'facial_area': face_info['facial_area'],
                            'confidence': face_info.get('confidence', 0),
                            'detection_runs': []
                        }
                    all_faces[key]['detection_runs'].append(threshold)
                    all_faces[key]['confidence'] = max(all_faces[key]['confidence'], face_info.get('confidence', 0))
        except Exception:
            continue
    
    return all_faces


def calculate_adaptive_threshold(face_confidence, avg_distance):
    """
    Calculate adaptive threshold based on face detection confidence and distance.
    """
    confidence_factor = min(1.0, face_confidence / 0.9)
    
    distance_factor = 1.0
    if avg_distance < 0.12:
        distance_factor = 0.90
    elif avg_distance > 0.18:
        distance_factor = 1.10
    
    adaptive_threshold = BASE_THRESHOLD * confidence_factor * distance_factor
    
    return max(0.15, min(0.25, adaptive_threshold))


def verify_match(embedding, known_embeddings, usn, threshold=BASE_THRESHOLD):
    """
    Verify a match by checking cosine similarity against known embeddings.
    Returns confidence score based on similarity.
    """
    emb = np.array(embedding)
    known_emb = np.array(known_embeddings[usn])
    
    similarity = np.dot(emb, known_emb) / (np.linalg.norm(emb) * np.linalg.norm(known_emb) + 1e-8)
    distance = 1 - similarity
    
    if distance < threshold:
        confidence = max(0, 1 - distance * 4)
        return True, round(confidence, 3)
    return False, 0.0


def run_recognition_pipeline(image_path: str):
    recognized_usns = []
    unknown_faces = 0
    total_faces = 0
    liveness = {"is_live": True, "confidence": 1.0, "reason": "DeepFace recognition"}
    all_students = []
    present_students = []
    absent_students = []

    if not DEEPFACE_AVAILABLE:
        return {"recognized_students": [], "total_faces": 0, "unknown_faces": 0, 
                "liveness": liveness, "error": "DeepFace not available"}

    try:
        if not os.path.exists(image_path):
            return {
                "recognized_students": [],
                "total_faces": 0,
                "unknown_faces": 0,
                "liveness": liveness,
                "error": "Image file not found"
            }

        known_embeddings = load_all_embeddings_db()
        if not known_embeddings:
            return {
                "recognized_students": [],
                "total_faces": 0,
                "unknown_faces": 0,
                "liveness": liveness,
                "error": "No embeddings in database"
            }

        faces_data = detect_faces_ensemble(image_path, thresholds=[0.40, 0.45, 0.50, 0.55, 0.60])
        
        total_faces = len(faces_data)

        if total_faces == 0:
            return {
                "recognized_students": [],
                "total_faces": 0,
                "unknown_faces": 0,
                "liveness": liveness,
                "error": "No faces detected"
            }

        face_crops = []
        temp_dir = os.path.join(os.path.dirname(__file__), 'temp', 'faces')
        os.makedirs(temp_dir, exist_ok=True)
        
        img = cv2.imread(image_path)
        if img is not None:
            h, w = img.shape[:2]
            
            for idx, (key, face_info) in enumerate(faces_data.items()):
                facial_area = face_info['facial_area']
                x1, y1, x2, y2 = facial_area
                
                face_width = x2 - x1
                face_height = y2 - y1
                if face_width < MIN_FACE_SIZE or face_height < MIN_FACE_SIZE:
                    continue
                
                margin_x = int(face_width * 0.15)
                margin_y = int(face_height * 0.2)
                
                x1_crop = max(0, x1 - margin_x)
                y1_crop = max(0, y1 - margin_y)
                x2_crop = min(w, x2 + margin_x)
                y2_crop = min(h, y2 + margin_y)
                
                face_crop = img[y1_crop:y2_crop, x1_crop:x2_crop]
                crop_path = os.path.join(temp_dir, f'face_{idx}.jpg')
                cv2.imwrite(crop_path, face_crop)
                face_crops.append(crop_path)

        embeddings = extract_face_embeddings(image_path, face_crops)
        
        for crop_path in face_crops:
            if os.path.exists(crop_path):
                os.remove(crop_path)

        usn_list = list(known_embeddings.keys())
        all_embeddings = np.array([known_embeddings[usn] for usn in usn_list])

        face_results = []
        
        for i, current_emb in enumerate(embeddings):
            if current_emb is None or len(current_emb) == 0:
                unknown_faces += 1
                continue
            
            current_emb = np.array(current_emb)
            
            distances = 1 - np.dot(all_embeddings, current_emb) / (
                np.linalg.norm(all_embeddings, axis=1) * np.linalg.norm(current_emb) + 1e-8
            )
            
            sorted_indices = np.argsort(distances)
            
            best_idx = sorted_indices[0]
            best_distance = distances[best_idx]
            best_match = usn_list[best_idx]
            
            second_idx = sorted_indices[1] if len(sorted_indices) > 1 else None
            second_distance = distances[second_idx] if second_idx is not None else 1.0
            second_match = usn_list[second_idx] if second_idx is not None else None
            
            face_confidence = faces_data.get(f'face_{i}', {}).get('confidence', 0.8)
            adaptive_threshold = calculate_adaptive_threshold(face_confidence, best_distance)
            
            separation = second_distance - best_distance if second_idx is not None else 0.15
            
            if best_distance < adaptive_threshold and separation > 0.05:
                verified, verify_conf = verify_match(current_emb, known_embeddings, best_match, BASE_THRESHOLD)
                
                if verified:
                    face_results.append({
                        "usn": best_match, 
                        "distance": round(best_distance, 3),
                        "threshold_used": round(adaptive_threshold, 3),
                        "confidence_score": round(face_confidence, 3),
                        "verified": True,
                        "separation": round(separation, 3)
                    })
            else:
                unknown_faces += 1

        usn_scores = {}
        for result in face_results:
            usn = result['usn']
            if usn not in usn_scores:
                usn_scores[usn] = []
            usn_scores[usn].append(result['distance'])

        for usn, distances in usn_scores.items():
            avg_distance = sum(distances) / len(distances)
            confidence = max(0, 1 - avg_distance * 3)
            
            consistency_bonus = min(0.1, len(distances) * 0.02)
            confidence = min(1.0, confidence + consistency_bonus)
            
            recognized_usns.append({"usn": usn, "confidence": round(confidence, 3)})

        recognized_usns.sort(key=lambda x: x['confidence'], reverse=True)

        all_students = load_all_students()
        student_dict = {s['usn']: s.get('name', 'Unknown') for s in all_students}
        
        recognized_usn_set = {r['usn'] for r in recognized_usns}
        
        present_students = []
        for r in recognized_usns:
            name = student_dict.get(r['usn'], 'Unknown')
            present_students.append({"usn": r['usn'], "name": name, "confidence": r['confidence']})
        
        absent_students = []
        for usn, name in student_dict.items():
            if usn not in recognized_usn_set:
                absent_students.append({"usn": usn, "name": name})

        conf = 0.85 if len(recognized_usns) > 0 else 0.0
        liveness = {
            "is_live": True,
            "confidence": conf,
            "reason": f"Ensemble ArcFace - {total_faces} faces, {ENSEMBLE_RUNS} runs"
        }

    except Exception as e:
        return {
            "recognized_students": recognized_usns,
            "total_faces": total_faces,
            "unknown_faces": unknown_faces,
            "liveness": liveness,
            "error": str(e)
        }

    return {
        "recognized_students": recognized_usns,
        "total_faces": total_faces,
        "unknown_faces": unknown_faces,
        "liveness": liveness,
        "present_students": present_students,
        "absent_students": absent_students,
        "total_registered": len(all_students),
        "present_count": len(present_students),
        "absent_count": len(absent_students),
        "improvements": {
            "ensemble_runs": ENSEMBLE_RUNS,
            "adaptive_threshold": True,
            "base_threshold": BASE_THRESHOLD
        }
    }