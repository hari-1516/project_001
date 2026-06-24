import numpy as np
import cv2
import time
import os

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from deepface import DeepFace

# Create test image
img = np.ones((200, 200, 3), dtype=np.uint8) * 200
cv2.circle(img, (100, 100), 60, (180, 150, 130), -1)  # face
cv2.circle(img, (85, 90), 8, (80, 60, 40), -1)  # left eye
cv2.circle(img, (115, 90), 8, (80, 60, 40), -1)  # right eye

# Save test image
test_img_path = 'test_face.jpg'
cv2.imwrite(test_img_path, img)

print("=" * 50)
print("Testing DeepFace Models")
print("=" * 50)

models_to_test = ['ArcFace', 'VGG-Face', 'Facenet512', 'OpenFace', 'Dlib']

for model_name in models_to_test:
    print(f"\n--- Testing {model_name} ---")
    try:
        start = time.time()
        result = DeepFace.represent(
            img_path=test_img_path,
            model_name=model_name,
            enforce_detection=False,
            detector_backend='ssd'
        )
        elapsed = time.time() - start
        emb_len = len(result[0]['embedding'])
        print(f"[OK] {model_name}: {elapsed:.2f}s - Embedding size: {emb_len}")
    except Exception as e:
        print(f"[FAIL] {model_name}: {str(e)[:80]}")

print("\n" + "=" * 50)
print("Testing Face Detectors")
print("=" * 50)

detectors_to_test = ['opencv', 'ssd', 'mtcnn', 'retinaface', 'dlib']

for detector in detectors_to_test:
    print(f"\n--- Testing {detector} ---")
    try:
        start = time.time()
        result = DeepFace.represent(
            img_path=test_img_path,
            model_name='ArcFace',
            enforce_detection=False,
            detector_backend=detector
        )
        elapsed = time.time() - start
        print(f"[OK] {detector}: {elapsed:.2f}s")
    except Exception as e:
        print(f"[FAIL] {detector}: {str(e)[:80]}")

# Cleanup
if os.path.exists(test_img_path):
    os.remove(test_img_path)

print("\n" + "=" * 50)
print("Summary: Check which models work best for your setup")
print("=" * 50)