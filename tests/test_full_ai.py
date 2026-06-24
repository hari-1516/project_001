import numpy as np
import cv2
import requests
import time

print("Testing AI Registration & Recognition Pipeline...")

img = np.ones((400, 400, 3), dtype=np.uint8) * 200
cv2.circle(img, (200, 200), 80, (180, 150, 130), -1)
cv2.circle(img, (180, 180), 10, (80, 60, 40), -1)
cv2.circle(img, (220, 180), 10, (80, 60, 40), -1)
cv2.ellipse(img, (200, 230), (30, 15), 0, 0, 180, (120, 80, 60), -1)

cv2.imwrite('test_face.jpg', img)

print("\n1. Testing Registration Endpoint...")
with open('test_face.jpg', 'rb') as f:
    start = time.time()
    r = requests.post('http://localhost:8001/register', files={'file': f}, timeout=60)
    elapsed = time.time() - start
    result = r.json()
    print(f"Time: {elapsed:.2f}s")
    print(f"Status: {r.status_code}")
    print(f"Has Embedding: {result.get('embedding') is not None}")
    print(f"Liveness: {result.get('liveness')}")
    if result.get('quality'):
        print(f"Quality: {result.get('quality')}")
    embedding = result.get('embedding')

print("\n2. Model Configuration Check...")
try:
    with open(r'D:\ai c\project_001\ai-service\recognize_faces.py', 'r') as f:
        content = f.read()
        if 'ArcFace' in content:
            print("- Recognition Model: ArcFace")
        if 'mtcnn' in content:
            print("- Detector: MTCNN")
        if '0.6' in content:
            print("- Threshold: 0.6")
except Exception as e:
    print(f"Error reading config: {e}")

print("\n3. DeepFace Direct Test...")
try:
    import sys
    sys.path.insert(0, r'D:\ai c\project_001\ai-service')
    import os
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    
    from deepface import DeepFace
    
    start = time.time()
    result = DeepFace.represent(
        img_path='test_face.jpg',
        model_name='ArcFace',
        enforce_detection=True,
        detector_backend='mtcnn'
    )
    elapsed = time.time() - start
    
    print(f"Time: {elapsed:.2f}s")
    print(f"Faces detected: {len(result)}")
    print(f"Embedding size: {len(result[0]['embedding']) if result else 0}")
    print("- ArcFace + MTCNN: WORKING")
except Exception as e:
    print(f"DeepFace Error: {e}")

import os
os.remove('test_face.jpg')
print("\nAll tests complete!")