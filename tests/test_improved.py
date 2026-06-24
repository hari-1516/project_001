import requests
import time
import os

test_img = r'D:\ai c\project_001\server\uploads\image-1779303475937-249344937.png'
if os.path.exists(test_img):
    with open(test_img, 'rb') as f:
        print('Testing improved recognition...')
        start = time.time()
        r = requests.post('http://localhost:8001/recognize', files={'file': f}, timeout=120)
        elapsed = time.time() - start
        result = r.json()
        print(f'Time: {elapsed:.2f}s')
        print(f'Faces detected: {result.get("total_faces", 0)}')
        print(f'Recognized: {result.get("recognized_students", [])}')
        print(f'Present: {result.get("present_count", 0)}, Absent: {result.get("absent_count", 0)}')
        if result.get('error'):
            print(f'Error: {result.get("error")}')
else:
    print('Test image not found')