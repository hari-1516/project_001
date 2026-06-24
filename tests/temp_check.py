from pymongo import MongoClient
client = MongoClient("mongodb+srv://harishsiddaraju2005_db_user:CpEjEesHqK88Y5Ee@cluster0.e4byiil.mongodb.net/visionattend")
db = client.visionattend

students = list(db.students.find({}))
print(f"Students: {len(students)}")
for s in students:
    emb = s.get('embedding')
    has_emb = emb is not None and len(emb) > 0 if emb else False
    emb_len = len(emb) if emb else 0
    print(f"  USN={s.get('usn')}, Name={s.get('name')}, Embedding={'Yes' if has_emb else 'No'} ({emb_len} dims)")
