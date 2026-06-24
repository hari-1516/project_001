import numpy as np
import cv2
import requests
import time

print("Testing AI Service Model...")

img = np.ones((400, 400, 3), dtype=np.uint8) * 200
cv2.circle(img, (200, 200), 80, (180, 150, 130), -1)
cv2.circle(img, (180, 180), 10, (80, 60, 40), -1)
cv2.circle(img, (220, 180), 10, (80, 60, 40), -1)
cv2.ellipse(img, (200, 230), (30, 15), 0, 0, 180, (120, 80, 60), -1)

cv2.imwrite('test_face.jpg', img)

with open('test_face.jpg', 'rb') as f:
    print("\nSending test image to AI service...")
    start = time.time()
    r = requests.post('http://localhost:8001/recognize', files={'file': f}, timeout=120)
    elapsed = time.time() - start
    result = r.json()
    
    print(f"\nTime: {elapsed:.2f}s")
    print(f"Status: {r.status_code}")
    print(f"Total Faces: {result.get('total_faces', 0)}")
    print(f"Recognized: {result.get('recognized_students', [])}")
    print(f"Present: {result.get('present_count', 0)}")
    print(f"Absent: {result.get('absent_count', 0)}")
    if result.get('error'):
        print(f"Error: {result.get('error')}")
    if result.get('improvements'):
        print(f"Model: {result.get('improvements')}")

import os
os.remove('test_face.jpg')
print("\nTest complete!")