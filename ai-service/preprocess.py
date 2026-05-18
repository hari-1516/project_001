import cv2
import numpy as np


def preprocess_image(image_path: str) -> np.ndarray:
    """
    Load and preprocess an image for face recognition.
    - Resizes to a standard size
    - Converts to RGB
    - Normalizes brightness
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at path: {image_path}")

    # Convert BGR (OpenCV default) to RGB (required by DeepFace)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Normalize brightness using CLAHE on the L channel
    img_lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(img_lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_eq = clahe.apply(l)
    img_lab_eq = cv2.merge((l_eq, a, b))
    img_normalized = cv2.cvtColor(img_lab_eq, cv2.COLOR_LAB2RGB)

    return img_normalized


def resize_image(img: np.ndarray, max_size: int = 1280) -> np.ndarray:
    """
    Resize image to a maximum dimension while preserving aspect ratio.
    Large images slow down detection.
    """
    h, w = img.shape[:2]
    if max(h, w) <= max_size:
        return img

    scale = max_size / max(h, w)
    new_w = int(w * scale)
    new_h = int(h * scale)
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def crop_face(img: np.ndarray, face_region: dict, padding: float = 0.2) -> np.ndarray:
    """
    Crop a face from an image with optional padding.
    face_region: dict with keys x, y, w, h
    """
    x, y, w, h = face_region['x'], face_region['y'], face_region['w'], face_region['h']
    ih, iw = img.shape[:2]

    pad_x = int(w * padding)
    pad_y = int(h * padding)

    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(iw, x + w + pad_x)
    y2 = min(ih, y + h + pad_y)

    return img[y1:y2, x1:x2]
