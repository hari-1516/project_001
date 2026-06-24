import os
import cv2
import numpy as np
from anti_spoof import check_liveness
from preprocess import preprocess_for_registration

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False

MODEL_NAME = 'ArcFace'
DETECTOR = 'mtcnn'
FALLBACK_DETECTOR = 'retinaface'


def calculate_blur_score(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    return laplacian.var()


def calculate_brightness(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    return np.mean(gray)


def calculate_contrast(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    return np.std(gray)


def calculate_face_quality(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    blur = calculate_blur_score(image)
    blur_score = min(blur / 200.0, 1.0)

    brightness = np.mean(gray)
    brightness_score = 1.0 - abs(brightness - 127.5) / 127.5

    contrast = np.std(gray)
    contrast_score = min(contrast / 60.0, 1.0)

    h, w = gray.shape[:2]
    face_size_score = min(max(h, w) / 150.0, 1.0)

    quality = (
        blur_score * 0.35 +
        brightness_score * 0.25 +
        contrast_score * 0.2 +
        face_size_score * 0.2
    )
    return float(quality)


def check_image_quality(image_path, min_blur=20, min_brightness=30, max_brightness=235):
    img = cv2.imread(image_path)
    if img is None:
        return False, "Could not read image", 0.0

    blur_score = calculate_blur_score(img)
    brightness = calculate_brightness(img)
    contrast = calculate_contrast(img)

    quality = calculate_face_quality(img)

    if blur_score < min_blur:
        return False, f"Image too blurry (blur score: {blur_score:.1f})", quality

    if brightness < min_brightness:
        return False, f"Image too dark (brightness: {brightness:.1f})", quality

    if brightness > max_brightness:
        return False, f"Image too bright (brightness: {brightness:.1f})", quality

    if contrast < 10:
        return False, f"Image low contrast (contrast: {contrast:.1f})", quality

    return True, "Quality check passed", quality


def extract_embedding(image_path):
    if not DEEPFACE_AVAILABLE:
        return None, "DeepFace not available"

    enhanced_path = None
    try:
        enhanced_path = preprocess_for_registration(image_path)

        try:
            result = DeepFace.represent(
                img_path=enhanced_path,
                model_name=MODEL_NAME,
                enforce_detection=True,
                detector_backend=DETECTOR,
                align=True
            )
        except Exception as e1:
            print(f"MTCNN failed: {e1}, trying fallback...")
            result = DeepFace.represent(
                img_path=enhanced_path,
                model_name=MODEL_NAME,
                enforce_detection=True,
                detector_backend=FALLBACK_DETECTOR,
                align=True
            )

        if not result or len(result) == 0:
            return None, "Face detection failed"

        embedding = result[0]["embedding"]
        embedding = np.array(embedding, dtype=np.float64)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        return embedding.tolist(), "Success"

    except Exception as e:
        if "Face could not be detected" in str(e):
            return None, "No face detected"
        return None, str(e)
    finally:
        if enhanced_path and os.path.exists(enhanced_path):
            try:
                os.remove(enhanced_path)
            except Exception:
                pass


def run_registration_pipeline(image_path: str):
    if not os.path.exists(image_path):
        return {"embedding": None, "liveness": {"is_live": False, "confidence": 0.0, "reason": "File not found"}, "quality": {"passed": False, "reason": "File not found"}}

    if not DEEPFACE_AVAILABLE:
        return {"embedding": None, "liveness": {"is_live": False, "confidence": 0.0, "reason": "DeepFace not available"}, "quality": {"passed": False, "reason": "DeepFace not available"}}

    quality_passed, quality_reason, quality_score = check_image_quality(image_path)

    if not quality_passed:
        return {"embedding": None, "liveness": {"is_live": False, "confidence": 0.0, "reason": "Quality check failed"}, "quality": {"passed": False, "reason": quality_reason, "score": quality_score}}

    embedding, emb_reason = extract_embedding(image_path)

    if embedding is None:
        return {"embedding": None, "liveness": {"is_live": False, "confidence": 0.0, "reason": emb_reason}, "quality": {"passed": True, "reason": "Quality check passed", "score": quality_score}}

    return {
        "embedding": embedding,
        "liveness": check_liveness(image_path),
        "quality": {
            "passed": True,
            "reason": "Quality check passed",
            "score": quality_score
        }
    }


def run_multi_registration_pipeline(image_paths: list):
    if not image_paths or len(image_paths) == 0:
        return {"embedding": None, "liveness": {"is_live": False, "confidence": 0.0, "reason": "No images provided"}, "quality": {"passed": False, "reason": "No images provided"}}

    if not DEEPFACE_AVAILABLE:
        return {"embedding": None, "liveness": {"is_live": False, "confidence": 0.0, "reason": "DeepFace not available"}, "quality": {"passed": False, "reason": "DeepFace not available"}}

    embeddings = []
    weights = []
    failed_images = []
    quality_results = []

    for img_path in image_paths:
        if not os.path.exists(img_path):
            failed_images.append({"path": img_path, "reason": "File not found"})
            continue

        quality_passed, quality_reason, quality_score = check_image_quality(img_path)
        quality_results.append({"path": img_path, "passed": quality_passed, "reason": quality_reason, "score": quality_score})

        if not quality_passed:
            failed_images.append({"path": img_path, "reason": quality_reason})
            continue

        embedding, emb_reason = extract_embedding(img_path)

        if embedding is None:
            failed_images.append({"path": img_path, "reason": emb_reason})
        else:
            embeddings.append(np.array(embedding))
            weights.append(max(quality_score, 0.1))

    if len(embeddings) == 0:
        return {
            "embedding": None,
            "liveness": {"is_live": False, "confidence": 0.0, "reason": f"Failed: {len(failed_images)}/{len(image_paths)} images"},
            "quality": {"passed": False, "reason": f"{len(failed_images)} images failed quality check"},
            "failed_images": failed_images,
            "quality_results": quality_results
        }

    weights = np.array(weights)
    weights = weights / weights.sum()

    avg_embedding = np.zeros_like(embeddings[0])
    for emb, w in zip(embeddings, weights):
        avg_embedding += emb * w

    avg_norm = np.linalg.norm(avg_embedding)
    if avg_norm > 0:
        avg_embedding = avg_embedding / avg_norm

    avg_embedding_list = [float(v) for v in avg_embedding.tolist()]

    quality_pass_count = sum(1 for q in quality_results if q["passed"])
    avg_quality = np.mean([q.get("score", 0) for q in quality_results if q["passed"]]) if quality_pass_count > 0 else 0

    liveness_result = check_liveness(image_paths[0]) if image_paths else {"is_live": False, "confidence": 0.0, "reason": "No image for liveness check"}

    return {
        "embedding": avg_embedding_list,
        "liveness": liveness_result,
        "quality": {
            "passed": quality_pass_count >= min(2, len(image_paths)),
            "reason": f"{quality_pass_count}/{len(image_paths)} passed quality check",
            "avg_score": float(avg_quality)
        },
        "embeddings_count": len(embeddings),
        "failed_images": failed_images,
        "quality_results": quality_results
    }
