from pymongo import MongoClient
client = MongoClient("mongodb+srv://harishsiddaraju2005_db_user:CpEjEesHqK88Y5Ee@cluster0.e4byiil.mongodb.net/visionattend")
db = client.visionattend
students = list(db.students.find({"usn": "4PS23CS053"}, {"usn": 1, "images": 1}))
for s in students:
    print(s)