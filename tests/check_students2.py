from pymongo import MongoClient

client = MongoClient('mongodb+srv://harishsiddaraju2005_db_user:CpEjEesHqK88Y5Ee@cluster0.e4byiil.mongodb.net/visionattend')
db = client.visionattend
students = list(db.students.find({}))
print(f'Students in DB: {len(students)}')
for s in students:
    emb = s.get('embedding', [])
    print(f'  {s["usn"]}: embedding length = {len(emb)}')