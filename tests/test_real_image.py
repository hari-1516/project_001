import requests
import time
import os

print("Testing with real uploaded image...")

img_path = r'D:\ai c\project_001\server\uploads\image-1779303475937-249344937.png'

if not os.path.exists(img_path):
    print("Image not found")
else:
    print(f"Using: {img_path}")
    
    print("\n1. Testing Registration...")
    with open(img_path, 'rb') as f:
        start = time.time()
        r = requests.post('http://localhost:8001/register', files={'file': f}, timeout=60)
        elapsed = time.time() - start
        result = r.json()
        print(f"Time: {elapsed:.2f}s")
        print(f"Has Embedding: {result.get('embedding') is not None}")
        if result.get('embedding'):
            print(f"Embedding Length: {len(result.get('embedding'))}")
        print(f"Liveness: {result.get('liveness')}")
        print(f"Quality: {result.get('quality')}")
    
    print("\n2. Testing Recognition...")
    with open(img_path, 'rb') as f:
        start = time.time()
        r = requests.post('http://localhost:8001/recognize', files={'file': f}, timeout=120)
        elapsed = time.time() - start
        result = r.json()
        print(f"Time: {elapsed:.2f}s")
        print(f"Faces: {result.get('total_faces', 0)}")
        print(f"Recognized: {result.get('recognized_students', [])}")
        print(f"Present: {result.get('present_count', 0)}, Absent: {result.get('absent_count', 0)}")
        if result.get('error'):
            print(f"Error: {result.get('error')}")

print("\nTest complete!")