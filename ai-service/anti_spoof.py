import cv2
import numpy as np


def check_liveness(image_path: str) -> dict:
    """
    Basic anti-spoofing using texture analysis (LBP-based).
    Returns a dict with is_live (bool) and confidence (float).
    
    Note: For production, use a dedicated anti-spoofing model (e.g., Silent-Face).
    This is a lightweight heuristic-based approach.
    """
    img = cv2.imread(image_path)
    if img is None:
        return {"is_live": False, "confidence": 0.0, "reason": "Could not read image"}

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # --- Texture Analysis (Laplacian Variance) ---
    # A printed photo or screen has lower texture variation
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

    # --- Reflection Check ---
    # Screens tend to have bright highlight spots
    _, bright_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    bright_ratio = np.sum(bright_mask > 0) / (gray.shape[0] * gray.shape[1])

    # --- Scoring ---
    # Higher Laplacian variance = more natural texture = more likely real
    # Lower bright ratio = no screen glare = more likely real
    texture_score = min(laplacian_var / 500.0, 1.0)  # Normalize to [0,1]
    glare_penalty = bright_ratio * 2.0               # Penalize for bright regions

    confidence = max(0.0, min(1.0, texture_score - glare_penalty))
    is_live = confidence > 0.3

    return {
        "is_live": is_live,
        "confidence": round(confidence, 3),
        "laplacian_variance": round(laplacian_var, 2),
        "bright_ratio": round(bright_ratio, 4),
        "reason": "Liveness check passed" if is_live else "Possible spoof detected (photo/screen)"
    }
