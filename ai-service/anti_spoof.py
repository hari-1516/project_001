import cv2
import numpy as np


def check_liveness(image_path: str) -> dict:
    """
    Multi-factor anti-spoofing using texture, frequency, and color analysis.
    Returns a dict with is_live (bool) and confidence (float).
    """
    img = cv2.imread(image_path)
    if img is None:
        return {"is_live": False, "confidence": 0.0, "reason": "Could not read image"}

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]

    # --- 1. Texture Analysis (Laplacian Variance) ---
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    texture_score = min(laplacian_var / 150.0, 1.0)

    # --- 2. Frequency Analysis (FFT) ---
    f = np.fft.fft2(gray.astype(np.float32))
    fshift = np.fft.fftshift(f)
    magnitude = np.abs(fshift)
    rows, cols = gray.shape
    crow, ccol = rows // 2, cols // 2
    radius = min(rows, cols) // 4
    mask = np.zeros((rows, cols), np.uint8)
    y, x = np.ogrid[:rows, :cols]
    mask_area = (x - ccol)**2 + (y - crow)**2 <= radius**2
    mask[mask_area] = 1
    low_freq = np.sum(magnitude * mask)
    total_freq = np.sum(magnitude)
    low_freq_ratio = low_freq / (total_freq + 1e-8)
    freq_score = min(low_freq_ratio / 0.8, 1.0)

    # --- 3. Color Distribution Analysis ---
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h_channel = hsv[:, :, 0]
    s_channel = hsv[:, :, 1]
    h_std = np.std(h_channel)
    s_mean = np.mean(s_channel)
    color_score = min((h_std / 30.0) * 0.5 + (s_mean / 100.0) * 0.5, 1.0)

    # --- 4. Glare/Reflection Detection ---
    _, bright_mask = cv2.threshold(gray, 235, 255, cv2.THRESH_BINARY)
    bright_ratio = np.sum(bright_mask > 0) / (h * w + 1e-8)
    glare_penalty = min(bright_ratio * 2.0, 0.3)

    # --- 5. Edge Density Analysis ---
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / (h * w + 1e-8)
    edge_score = min(edge_density / 0.15, 1.0)

    # --- 6. Noise Analysis ---
    denoised = cv2.GaussianBlur(gray, (5, 5), 0)
    noise = np.mean(np.abs(gray.astype(float) - denoised.astype(float)))
    noise_score = min(noise / 10.0, 1.0)

    # --- Weighted Combination ---
    confidence = float(max(0.0, min(1.0,
        texture_score * 0.25 +
        freq_score * 0.20 +
        color_score * 0.20 +
        edge_score * 0.20 +
        noise_score * 0.15 -
        glare_penalty
    )))

    is_live = bool(confidence >= 0.15)

    if confidence >= 0.40:
        reason = "Liveness check passed (high confidence)"
    elif confidence >= 0.25:
        reason = "Liveness check passed (medium confidence)"
    elif confidence >= 0.15:
        reason = "Liveness check passed (low confidence - verify manually)"
    else:
        reason = "Possible spoof detected (photo/screen/print)"

    return {
        "is_live": is_live,
        "confidence": round(confidence, 3),
        "details": {
            "texture": round(float(texture_score), 3),
            "frequency": round(float(freq_score), 3),
            "color": round(float(color_score), 3),
            "edge": round(float(edge_score), 3),
            "noise": round(float(noise_score), 3),
            "glare_penalty": round(float(glare_penalty), 3),
            "laplacian_variance": round(float(laplacian_var), 2),
            "bright_ratio": round(float(bright_ratio), 4)
        },
        "reason": reason
    }
