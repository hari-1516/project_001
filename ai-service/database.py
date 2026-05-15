from pymongo import MongoClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/visionattend")

def get_db():
    client = MongoClient(MONGO_URI)
    return client.visionattend

def load_all_embeddings():
    """
    Fetch all student embeddings from MongoDB to hold in memory.
    """
    db = get_db()
    students = list(db.students.find({}, {"usn": 1, "embedding": 1}))
    # Filter out students without an embedding
    return [s for s in students if s.get("embedding") and len(s["embedding"]) > 0]

