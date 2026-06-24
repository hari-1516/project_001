from pymongo import MongoClient
import requests
import os

client = MongoClient("mongodb+srv://harishsiddaraju2005_db_user:CpEjEesHqK88Y5Ee@cluster0.e4byiil.mongodb.net/visionattend")
db = client.visionattend

print("=" * 60)
print("DATABASE CHECK")
print("=" * 60)

students = list(db.students.find({}, {"usn": 1, "name": 1, "embedding": 1}))
print(f"\nTotal students in DB: {len(students)}")

for s in students:
    emb = s.get('embedding')
    emb_len = len(emb) if emb else 0
    has_emb = "YES" if emb_len > 0 else "NO"
    print(f"  - {s['usn']}: {s['name']} | Embedding: {emb_len} dims | Has: {has_emb}")

print("\n" + "=" * 60)
print("AI SERVICE CHECK")
print("=" * 60)

try:
    r = requests.get('http://localhost:8001/health', timeout=5)
    print(f"\nAI Service Status: {r.json()}")
except Exception as e:
    print(f"\nAI Service Error: {e}")

print("\n" + "=" * 60)
print("MODEL CONFIG CHECK")
print("=" * 60)

try:
    from recognize_faces import MODEL_NAME, BASE_THRESHOLD, MIN_FACE_SIZE
    from register_face import MODEL_NAME as REG_MODEL
    print(f"\nRecognition Model: {MODEL_NAME}")
    print(f"Registration Model: {REG_MODEL}")
    print(f"Match: {'YES' if MODEL_NAME == REG_MODEL else 'NO - MISMATCH!'}")
    print(f"Threshold: {BASE_THRESHOLD}")
    print(f"Min Face Size: {MIN_FACE_SIZE}")
except Exception as e:
    print(f"Error loading models: {e}")

print("\n" + "=" * 60)