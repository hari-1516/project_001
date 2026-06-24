from deepface import DeepFace
import numpy as np
import time

print("Testing VGG-Face model...")
start = time.time()

img = np.zeros((112, 112, 3), dtype=np.uint8)

try:
    result = DeepFace.represent(img_path=img, model_name="VGG-Face", enforce_detection=False)
    print(f"VGG-Face works! Time: {time.time()-start:.2f}s")
    print(f"Embedding length: {len(result[0]['embedding'])}")
except Exception as e:
    print(f"Error: {e}")