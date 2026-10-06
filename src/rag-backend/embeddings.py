import os
from langchain_huggingface import HuggingFaceEndpointEmbeddings

hf_token = os.getenv("HF_TOKEN")
if not hf_token:
    raise RuntimeError("HF_TOKEN environment variable is not set")

EMBED = HuggingFaceEndpointEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2",
    huggingfacehub_api_token=hf_token,
)
