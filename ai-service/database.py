from pymongo import MongoClient
import os
from dotenv import load_dotenv
import dns.resolver

# Force dnspython to use Google DNS to fix SRV lookup issues on some networks
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/visionattend")

client = None
students_collection = None

def get_db():
    global client
    if client is None:
        client = MongoClient(MONGO_URI)
    return client.visionattend

def load_all_embeddings():
    """
    Fetch all student embeddings from MongoDB.
    """
    db = get_db()
    students = list(db.students.find({}, {"usn": 1, "embedding": 1}))
    return [s for s in students if s.get("embedding") and len(s["embedding"]) > 0]

# Initialize collection reference
try:
    db = get_db()
    students_collection = db.students
except Exception as e:
    print(f"⚠️  MongoDB connection warning: {e}")
    students_collection = None
