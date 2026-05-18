import sys
sys.path.append('.')
from database import load_all_embeddings
try:
    students = load_all_embeddings()
    print(f'Loaded {len(students)} students')
    for s in students:
        print(f"USN: {s.get('usn')}, Embedding length: {len(s.get('embedding', []))}")
except Exception as e:
    print(f"Error: {e}")
