from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def find_duplicate_ticket(new_description: str, open_tickets: list, threshold: float = 0.40):
    """
    Finds duplicate ticket among open tickets using dynamic TF-IDF vectorization.
    Fits vectorizer fresh on combined list of [all open tickets' descriptions + new ticket description].
    Returns (matched_ticket, similarity_score) if similarity >= threshold, else None.
    """
    if not open_tickets:
        return None

    corpus = [t["description"] for t in open_tickets] + [new_description]
    
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
    except Exception as e:
        print(f"[Duplicate Service] TF-IDF fitting error: {e}")
        return None

    new_vec = tfidf_matrix[-1]
    existing_vecs = tfidf_matrix[:-1]

    similarities = cosine_similarity(new_vec, existing_vecs)[0]

    max_idx = None
    max_score = 0.0

    for idx, score in enumerate(similarities):
        if score > max_score:
            max_score = score
            max_idx = idx

    if max_idx is not None and max_score >= threshold:
        return open_tickets[max_idx], float(max_score)

    return None
