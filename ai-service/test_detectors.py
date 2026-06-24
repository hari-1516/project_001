import numpy as np
import cv2
import time
import os

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from deepface import DeepFace

img = np.ones((200, 200, 3), dtype=np.uint8) * 200
cv2.circle(img, (100, 100), 60, (180, 150, 130), -1)
cv2.circle(img, (85, 90), 8, (80, 60, 40), -1)
cv2.circle(img, (115, 90), 8, (80, 60, 40), -1)
cv2.imwrite('test_face.jpg', img)

print("Testing ArcFace model with different detectors...")
print("-" * 50)

detectors = ['ssd', 'opencv', 'mtcnn', 'retinaface']

for detector in detectors:
    try:
        start = time.time()
        result = DeepFace.represent(
            img_path='test_face.jpg',
            model_name='ArcFace',
            enforce_detection=False,
            detector_backend=detector
        )
        elapsed = time.time() - start
        print(f"{detector}: OK ({elapsed:.2f}s)")
    except Exception as e:
        print(f"{detector}: FAILED - {str(e)[:60]}")

print("-" * 50)
print("Test complete")

if os.path.exists('test_face.jpg'):
    os.remove('test_face.jpg')