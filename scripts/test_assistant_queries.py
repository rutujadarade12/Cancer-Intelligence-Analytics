from fastapi.testclient import TestClient
from backend.main import app

def test_queries():
    c = TestClient(app)
    queries = [
        "What is the cancer burden in Maharashtra?",
        "Tell me about Breast cancer",
        "What happened in year 2022?",
        "What happened in year 1800?",
        "Cancer in Atlantis",
        "Do I have cancer? What is the chemotherapy dosage for me?",
        "How is the weather today?"
    ]
    
    print("\n=== ASSISTANT QUERY TEST RUNNER ===")
    for q in queries:
        res = c.post("/api/assistant/query", json={"query": q})
        assert res.status_code == 200, f"Failed for {q}"
        data = res.json()
        print(f"QUERY:  {q}")
        print(f"INTENT: {data['intent']}")
        print(f"ANSWER:\n{data['answer']}")
        print(f"SOURCES: {data['table_sources']}")
        print("-" * 50)

if __name__ == "__main__":
    test_queries()
