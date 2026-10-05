import os
from langchain_huggingface import HuggingFaceEndpointEmbeddings

EMBED = HuggingFaceEndpointEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2",
    huggingfacehub_api_token=os.getenv("HF_TOKEN"),
)
