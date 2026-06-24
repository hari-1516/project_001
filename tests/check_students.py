import requests
r = requests.get('http://localhost:5000/api/students', headers={'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMGRmOGJlZDc4Mzk1YTM5MzFlM2I3YiIsImlhdCI6MTc3OTMwMTQ0OCwiZXhwIjoxNzgxODkzNDQ4fQ.OkVsumkdy3NH5-tyOGqBT_pNacovFmUb3zL5WCWJ518'})
students = r.json()
for s in students:
    print(f"USN: {s.get('usn')}, Name: {s.get('name')}, Has embedding: {s.get('hasEmbedding')}")