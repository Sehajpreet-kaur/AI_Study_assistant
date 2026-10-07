import os
from qdrant_client import QdrantClient, models
from langchain_qdrant import QdrantVectorStore
from embeddings import EMBED

COLLECTION = "study_docs"

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

# Create the collection once if it doesn't exist (384 = all-MiniLM-L6-v2 size)
if not client.collection_exists(COLLECTION):
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    )
    for field in ("metadata.doc_id", "metadata.user_id"):
        client.create_payload_index(
            COLLECTION, field_name=field,
            field_schema=models.PayloadSchemaType.KEYWORD,
        )

db = QdrantVectorStore(client=client, collection_name=COLLECTION, embedding=EMBED)

def doc_filter(doc_id: str, user_id: str) -> models.Filter:
    return models.Filter(must=[
        models.FieldCondition(key="metadata.doc_id",  match=models.MatchValue(value=doc_id)),
        models.FieldCondition(key="metadata.user_id", match=models.MatchValue(value=user_id)),
    ])