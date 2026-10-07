from groq import Groq
import os
from dotenv import load_dotenv
load_dotenv()
from embeddings import EMBED
from vectorstore import db, doc_filter


client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def answer_question(question: str, doc_id: str, user_id: str) -> dict:
    print("1: searching | total chunks in DB:", db._collection.count())
    results = db.similarity_search(
        question, k=4,
        filter=doc_filter(doc_id, user_id)
    )

    if not results:
        return {
            "answer": "I couldn't find relevant information in your document.",
            "sources": []
        }

    context = "\n\n".join(r.page_content for r in results)
    prompt = f"""You are a study assistant. Answer ONLY from the context.
If the answer is not in the context, say exactly: "I don't have enough information in this document."

Context:
{context}

Question: {question}
Answer:"""

    print("2: calling groq")
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        stream=False
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": [
            {"page": r.metadata.get("page", "?"),
             "preview": r.page_content[:200]}
            for r in results
        ]
    }