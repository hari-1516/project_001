from pymongo import MongoClient
import os
import threading
from dotenv import load_dotenv

try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
except ImportError:
    pass

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/visionattend")

_client = None
_client_lock = threading.Lock()

def get_db():
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client.visionattend

def load_all_embeddings():
    """
    Fetch all student embeddings from MongoDB.
    """
    db = get_db()
    students = list(db.students.find(
        {"embedding": {"$exists": True, "$ne": None, "$ne": []}},
        {"usn": 1, "embedding": 1}
    ))
    return students


def load_all_students():
    """
    Fetch all students with their USN and name.
    """
    db = get_db()
    students = list(db.students.find({}, {"usn": 1, "name": 1, "_id": 0}))
    return students


def get_students_collection():
    """Lazy accessor for the students collection."""
    db = get_db()
    return db.students
