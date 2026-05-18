import numpy as np
from database import students_collection


def save_embedding(usn: str, embedding: list):
    """
    Save or update a face embedding for a student in MongoDB.
    """
    result = students_collection.update_one(
        {"usn": usn},
        {"$set": {"embedding": embedding}},
        upsert=False
    )
    return result.modified_count > 0


def load_all_embeddings() -> list:
    """
    Load all students that have a face embedding stored.
    Returns a list of dicts: [{ usn, name, embedding }, ...]
    """
    students = students_collection.find(
        {"embedding": {"$exists": True, "$ne": None}},
        {"usn": 1, "name": 1, "embedding": 1}
    )
    result = []
    for s in students:
        if s.get("embedding"):
            result.append({
                "usn": s["usn"],
                "name": s["name"],
                "embedding": np.array(s["embedding"], dtype=np.float32)
            })
    return result


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Compute cosine similarity between two embedding vectors.
    Returns a value between -1 and 1 (1 = identical).
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def find_best_match(query_embedding: np.ndarray, threshold: float = 0.6) -> dict | None:
    """
    Compare a query embedding against all stored embeddings.
    Returns the best match if similarity > threshold, else None.
    """
    all_students = load_all_embeddings()
    best_match = None
    best_score = -1.0

    for student in all_students:
        score = cosine_similarity(query_embedding, student["embedding"])
        if score > best_score:
            best_score = score
            best_match = student

    if best_match and best_score >= threshold:
        return {**best_match, "similarity": round(best_score, 4)}
    return None
