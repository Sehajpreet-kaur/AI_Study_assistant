from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import uuid, os
from embeddings import EMBED

DB_PATH = "./chroma_db"

def ingest_pdf(path: str, user_id: str) -> str:
    doc_id = str(uuid.uuid4())
    pages  = PyPDFLoader(path).load()
    chunks = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=100
    ).split_documents(pages)

    for chunk in chunks:
        chunk.metadata.update({"doc_id": doc_id, "user_id": user_id})

    Chroma.from_documents(chunks, EMBED,
        persist_directory=DB_PATH,
        collection_name="study_docs")
    return doc_id