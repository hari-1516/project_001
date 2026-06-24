import requests
import cv2
import numpy as np
import io
import json
import time

# Create test image with face-like features
img = np.ones((400, 400, 3), dtype=np.uint8) * 220
cv2.circle(img, (200, 200), 80, (180, 150, 130), -1)  # face
cv2.circle(img, (180, 180), 10, (80, 60, 40), -1)  # left eye
cv2.circle(img, (220, 180), 10, (80, 60, 40), -1)  # right eye
cv2.ellipse(img, (200, 230), (25, 15), 0, 0, 180, (120, 80, 60), -1)  # mouth
_, img_enc = cv2.imencode('.jpg', img)
img_bytes = io.BytesIO(img_enc.tobytes())

print("Testing AI recognition...")
start = time.time()
r = requests.post('http://localhost:8001/recognize', files={'file': ('test.jpg', img_bytes.getvalue(), 'image/jpeg')}, timeout=30)
print(f"Time: {time.time()-start:.2f}s")
print(f"Status: {r.status_code}")
print(json.dumps(r.json(), indent=2))