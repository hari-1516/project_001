import requests
import time
import os

print("Testing AI recognition with registered students...")
print("Students with embeddings: 4PS23CS053, 4PS23CS055, 4PS23CS051, 4PS23CS048")
print("Students without embeddings: 4PS23CS017")
print()

uploads_dir = r'D:\ai c\project_001\server\uploads'
test_images = [f for f in os.listdir(uploads_dir) if f.endswith(('.jpg', '.png', '.jpeg'))]

if test_images:
    test_img = os.path.join(uploads_dir, test_images[0])
    print(f"Using test image: {test_img}")
    
    with open(test_img, 'rb') as f:
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
else:
    print('No test images found')