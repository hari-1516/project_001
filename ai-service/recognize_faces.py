import cv2
import numpy as np
import os
from database import load_all_embeddings, load_all_students
from anti_spoof import check_liveness
from preprocess import preprocess_for_recognition, preprocess_for_registration

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False

MODEL_NAME = 'ArcFace'
DETECTOR = 'mtcnn'
FALLBACK_DETECTOR = 'retinaface'
MIN_FACE_SIZE = 40

# ============================================================
# THRESHOLDS — tuned from actual classroom log data
# ============================================================
BASE_THRESHOLD = 0.70
SEPARATION_THRESHOLD = 0.04
QUALITY_MIN = 0.20
CONFIDENCE_MIN = 0.55


def compute_face_quality(img, face_region):
    """Multi-factor face quality: 0.0 (worst) to 1.0 (best)."""
    try:
        x, y, w, h = face_region
        pad = int(min(w, h) * 0.1)
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2, y2 = min(img.shape[1], x + w + pad), min(img.shape[0], y + h + pad)
        face = img[y1:y2, x1:x2]
        if face.size == 0 or face.shape[0] < 10 or face.shape[1] < 10:
            return 0.0

        gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)

        # Blur
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        blur_score = min(laplacian_var / 300.0, 1.0)

        # Brightness
        brightness = np.mean(gray)
        if brightness < 40 or brightness > 240:
            brightness_score = 0.1
        elif brightness < 70 or brightness > 210:
            brightness_score = 0.5
        else:
            brightness_score = 1.0 - abs(brightness - 140.0) / 140.0

        # Contrast
        contrast = np.std(gray)
        contrast_score = min(contrast / 50.0, 1.0)

        # Face size
        face_size_score = min(max(w, h) / 100.0, 1.0)

        quality = (blur_score * 0.35 + brightness_score * 0.25 +
                   contrast_score * 0.25 + face_size_score * 0.15)
        return float(max(0.0, min(1.0, quality)))
    except Exception:
        return 0.5


def detect_faces(img, image_path):
    """Detect faces — MTCNN primary, RetinaFace fallback."""
    try:
        result = DeepFace.represent(
            img_path=image_path, model_name=MODEL_NAME,
            enforce_detection=True, detector_backend=DETECTOR, align=True
        )
        if result and len(result) > 0:
            return result, True
    except Exception as e:
        print(f"MTCNN failed: {e}, trying fallback...")

    try:
        result = DeepFace.represent(
            img_path=image_path, model_name=MODEL_NAME,
            enforce_detection=True, detector_backend=FALLBACK_DETECTOR, align=True
        )
        if result and len(result) > 0:
            return result, True
    except Exception as e:
        print(f"Fallback failed: {e}")

    return [], False


def cluster_faces(face_results):
    """Cluster multiple detections of same person — keep best detection."""
    if not face_results:
        return []

    sorted_results = sorted(face_results, key=lambda x: x['distance'])
    clusters = []
    assigned = set()

    for i, r in enumerate(sorted_results):
        if i in assigned:
            continue
        cluster = [r]
        assigned.add(i)
        for j, r2 in enumerate(sorted_results):
            if j in assigned:
                continue
            if r['usn'] == r2['usn']:
                cluster.append(r2)
                assigned.add(j)

        best = min(cluster, key=lambda x: x['distance'])
        clusters.append({
            'usn': r['usn'],
            'best_distance': float(best['distance']),
            'best_separation': float(best['separation']),
            'best_quality': float(best['quality']),
            'avg_distance': float(np.mean([c['distance'] for c in cluster])),
            'count': len(cluster)
        })

    return clusters


def calculate_confidence(distance, separation, face_quality, cluster_count):
    """Multi-factor confidence — conservative to avoid false positives."""
    # Base from distance
    if distance < 0.30:
        base = 0.98
    elif distance < 0.40:
        base = 0.93
    elif distance < 0.50:
        base = 0.82
    elif distance < 0.55:
        base = 0.72
    elif distance < 0.60:
        base = 0.62
    elif distance < 0.65:
        base = 0.52
    elif distance < 0.70:
        base = 0.42
    else:
        base = 0.30

    # Separation bonus — larger gap = more certain
    sep_bonus = min(separation * 0.8, 0.15)

    # Quality factor
    quality_factor = 0.6 + 0.4 * face_quality

    # Cluster bonus
    cluster_bonus = min((cluster_count - 1) * 0.04, 0.12)

    confidence = (base + sep_bonus + cluster_bonus) * quality_factor
    return float(max(0.0, min(0.99, confidence)))


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
            return {"recognized_students": [], "total_faces": 0, "unknown_faces": 0,
                    "liveness": liveness, "error": "Image file not found"}

        known_embeddings = load_all_embeddings_db()
        if not known_embeddings:
            return {"recognized_students": [], "total_faces": 0, "unknown_faces": 0,
                    "liveness": liveness, "error": "No embeddings in database"}

        num_registered = len(known_embeddings)
        print(f"Using ArcFace with {num_registered} registered students")

        img = cv2.imread(image_path)
        if img is None:
            return {"recognized_students": [], "total_faces": 0, "unknown_faces": 0,
                    "liveness": liveness, "error": "Could not read image"}

        enhanced_path = preprocess_for_recognition(image_path)
        try:
            result, detection_success = detect_faces(img, enhanced_path)
        finally:
            if enhanced_path != image_path and os.path.exists(enhanced_path):
                try:
                    os.remove(enhanced_path)
                except Exception:
                    pass

        if not detection_success or not result or len(result) == 0:
            return {"recognized_students": [], "total_faces": 0, "unknown_faces": 0,
                    "liveness": liveness, "error": "No faces detected in image"}

        total_faces = len(result)
        print(f"Detected {total_faces} faces")

        face_results = []

        usn_list = list(known_embeddings.keys())
        all_embeddings = np.array([known_embeddings[usn] for usn in usn_list])

        # Track which USNs are already matched (one match per person per image)
        matched_usns = set()

        for idx, face_data in enumerate(result):
            current_emb = np.array(face_data["embedding"], dtype=np.float64)
            emb_norm = np.linalg.norm(current_emb)
            if emb_norm > 0:
                current_emb = current_emb / emb_norm

            facial_area = face_data.get("facial_area", {})
            face_quality = 0.5
            if facial_area:
                face_quality = compute_face_quality(img, [
                    facial_area.get("x", 0), facial_area.get("y", 0),
                    facial_area.get("w", 0), facial_area.get("h", 0)
                ])

            if face_quality < QUALITY_MIN:
                print(f"Face {idx+1}: Skipped (quality={face_quality:.2f})")
                unknown_faces += 1
                continue

            # Cosine similarity
            cos_similarities = np.dot(all_embeddings, current_emb)
            distances = 1 - cos_similarities

            sorted_indices = np.argsort(distances)
            best_idx = sorted_indices[0]
            best_distance = float(distances[best_idx])
            best_match = usn_list[best_idx]

            # Check separation
            if len(sorted_indices) > 1:
                # Find best match that is NOT the same USN
                second_distance = float(distances[sorted_indices[1]])
                for si in sorted_indices[1:]:
                    if usn_list[si] != best_match:
                        second_distance = float(distances[si])
                        break
            else:
                second_distance = 1.0

            separation = second_distance - best_distance

            print(f"Face {idx+1}: Best={best_match} dist={best_distance:.4f} sep={separation:.4f} quality={face_quality:.2f}")

            # Match criteria — ALL must pass:
            # 1. Distance below threshold
            # 2. Separation above minimum
            # 3. This USN hasn't been matched yet from a better detection
            # 4. Confidence above minimum
            temp_confidence = calculate_confidence(best_distance, separation, face_quality, 1)

            is_match = (
                best_distance < BASE_THRESHOLD and
                separation > SEPARATION_THRESHOLD and
                temp_confidence >= CONFIDENCE_MIN
            )

            if is_match:
                # If this USN was already matched, only replace if this detection is better
                already_matched = False
                for fr in face_results:
                    if fr['usn'] == best_match:
                        already_matched = True
                        if best_distance < fr['distance']:
                            fr['distance'] = best_distance
                            fr['separation'] = separation
                            fr['quality'] = face_quality
                            fr['count'] += 1
                        break

                if not already_matched:
                    face_results.append({
                        "usn": best_match,
                        "distance": best_distance,
                        "separation": separation,
                        "quality": face_quality,
                        "count": 1
                    })
                    matched_usns.add(best_match)
                    print(f"  -> MATCHED {best_match} (conf={temp_confidence:.3f})")
            else:
                unknown_faces += 1
                reason = "distance" if best_distance >= BASE_THRESHOLD else (
                    "separation" if separation <= SEPARATION_THRESHOLD else "confidence")
                print(f"  -> Unknown ({reason})")

        # Build final results
        for fr in face_results:
            confidence = calculate_confidence(
                fr['distance'], fr['separation'], fr['quality'], fr['count']
            )
            recognized_usns.append({
                "usn": fr['usn'],
                "confidence": round(confidence, 3),
                "distance": round(fr['distance'], 4),
                "detections": fr['count']
            })

        recognized_usns.sort(key=lambda x: x['confidence'], reverse=True)

        all_students = load_all_students()
        student_dict = {s['usn']: s.get('name', 'Unknown') for s in all_students}
        recognized_usn_set = {r['usn'] for r in recognized_usns}

        for r in recognized_usns:
            name = student_dict.get(r['usn'], 'Unknown')
            present_students.append({
                "usn": r['usn'], "name": name,
                "confidence": r['confidence'],
                "distance": r.get('distance', 0),
                "detections": r.get('detections', 1)
            })

        for usn, name in student_dict.items():
            if usn not in recognized_usn_set:
                absent_students.append({"usn": usn, "name": name})

        liveness = check_liveness(image_path)

    except Exception as e:
        import traceback
        print(f"Recognition error: {e}")
        traceback.print_exc()
        return {
            "recognized_students": recognized_usns, "total_faces": total_faces,
            "unknown_faces": unknown_faces, "liveness": liveness, "error": str(e)
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
    }


def load_all_embeddings_db():
    """Load all embeddings from MongoDB and normalize."""
    db_embeddings = load_all_embeddings()
    embeddings_dict = {}
    for s in db_embeddings:
        if s.get('embedding') and len(s['embedding']) > 0:
            emb = np.array(s['embedding'], dtype=np.float64)
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
            embeddings_dict[s['usn']] = emb
    return embeddings_dict
