import os
from typing import List
from fastembed import TextEmbedding
from langchain_core.embeddings import Embeddings

class FastEmbedEmbeddings(Embeddings):
    def __init__(self, model_name="sentence-transformers/all-MiniLM-L6-v2", cache_dir=None):
        self.model = TextEmbedding(model_name=model_name, cache_dir=cache_dir)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [v.tolist() for v in self.model.embed(texts)]

    def embed_query(self, text: str) -> List[float]:
        return next(iter(self.model.embed([text]))).tolist()

EMBED = FastEmbedEmbeddings(cache_dir=os.getenv("FASTEMBED_CACHE", "./models"))