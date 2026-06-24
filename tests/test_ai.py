import requests
import cv2
import numpy as np
import io

# Create test image
img = np.ones((400, 400, 3), dtype=np.uint8) * 220
cv2.circle(img, (200, 200), 80, (180, 150, 130), -1)
cv2.circle(img, (180, 180), 10, (100, 80, 60), -1)
cv2.circle(img, (220, 180), 10, (100, 80, 60), -1)
cv2.ellipse(img, (200, 230), (30, 20), 0, 0, 180, (150, 100, 80), -1)
_, img_enc = cv2.imencode('.jpg', img)
img_bytes = io.BytesIO(img_enc.tobytes())

r = requests.post('http://localhost:8001/recognize', files={'file': ('test.jpg', img_bytes.getvalue(), 'image/jpeg')}, timeout=60)
print('Status:', r.status_code)
import json
print(json.dumps(r.json(), indent=2))