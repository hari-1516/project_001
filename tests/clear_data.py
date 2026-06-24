from pymongo import MongoClient
client = MongoClient("mongodb+srv://harishsiddaraju2005_db_user:CpEjEesHqK88Y5Ee@cluster0.e4byiil.mongodb.net/visionattend")
db = client.visionattend

# Delete all students
students_deleted = db.students.delete_many({}).deleted_count
print(f"Deleted {students_deleted} students")

# Delete all attendance records
attendance_deleted = db.attendances.delete_many({}).deleted_count
print(f"Deleted {attendance_deleted} attendance records")

# Delete all notifications
notifications_deleted = db.notifications.delete_many({}).deleted_count
print(f"Deleted {notifications_deleted} notifications")

# Delete all classes
classes_deleted = db.classes.delete_many({}).deleted_count
print(f"Deleted {classes_deleted} classes")

print("\nAll data deleted successfully!")