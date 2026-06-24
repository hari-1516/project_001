from pymongo import MongoClient
client = MongoClient("mongodb+srv://harishsiddaraju2005_db_user:CpEjEesHqK88Y5Ee@cluster0.e4byiil.mongodb.net/visionattend")
db = client.visionattend
students = list(db.students.find({}, {"usn": 1, "name": 1, "embedding": 1}))
for s in students:
    emb = s.get('embedding')
    print(f"USN: {s.get('usn')}, Name: {s.get('name')}, Embedding length: {len(emb) if emb else 0}")