import numpy as np
import cv2
import requests
import time
import os

print("Testing with better face image...")

img = np.ones((400, 400, 3), dtype=np.uint8)
img[:, :] = [220, 180, 150]

face_center = (200, 180)
face_radius = 100
cv2.circle(img, face_center, face_radius, (200, 165, 140), -1)

left_eye = (160, 160)
right_eye = (240, 160)
cv2.circle(img, left_eye, 12, (80, 60, 40), -1)
cv2.circle(img, right_eye, 12, (80, 60, 40), -1)

nose = (200, 190)
cv2.circle(img, nose, 8, (150, 120, 100), -1)

mouth_left = (170, 220)
mouth_right = (230, 220)
cv2.ellipse(img, (200, 215), (30, 15), 0, 0, 180, (100, 60, 60), 3)

cv2.imwrite('test_face2.jpg', img)

print("1. Testing Registration with enforce_detection=False...")
with open('test_face2.jpg', 'rb') as f:
    start = time.time()
    r = requests.post('http://localhost:8001/register', files={'file': f}, timeout=60)
    elapsed = time.time() - start
    result = r.json()
    print(f"Time: {elapsed:.2f}s")
    print(f"Has Embedding: {result.get('embedding') is not None}")
    print(f"Embedding Length: {len(result.get('embedding', []))}")
    print(f"Liveness: {result.get('liveness')}")

print("\n2. Testing Recognition...")
with open('test_face2.jpg', 'rb') as f:
    start = time.time()
    r = requests.post('http://localhost:8001/recognize', files={'file': f}, timeout=120)
    elapsed = time.time() - start
    result = r.json()
    print(f"Time: {elapsed:.2f}s")
    print(f"Faces: {result.get('total_faces', 0)}")
    print(f"Recognized: {result.get('recognized_students', [])}")
    if result.get('error'):
        print(f"Error: {result.get('error')}")

if os.path.exists('test_face2.jpg'):
    os.remove('test_face2.jpg')

print("\nTest complete!")