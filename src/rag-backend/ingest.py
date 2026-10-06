from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import uuid
from retriever import db  # reuse the shared Chroma client instead of creating a new one

# def ingest_pdf(path: str, user_id: str) -> str:
#     doc_id = str(uuid.uuid4())
#     pages = PyPDFLoader(path).load()
#     chunks = RecursiveCharacterTextSplitter(
#         chunk_size=1000, chunk_overlap=100
#     ).split_documents(pages)

#     for chunk in chunks:
#         chunk.metadata.update({"doc_id": doc_id, "user_id": user_id})

#     db.add_documents(chunks)
#     return doc_id

def ingest_pdf(path: str, user_id: str) -> str:
    doc_id = str(uuid.uuid4())
    pages = PyPDFLoader(path).load()
    print(f"Loaded {len(pages)} pages, total chars: {sum(len(p.page_content) for p in pages)}")

    chunks = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=100
    ).split_documents(pages)
    print(f"Split into {len(chunks)} chunks")

    if not chunks:
        raise ValueError("No extractable text found in this PDF. It may be a scanned/image-based document.")

    for chunk in chunks:
        chunk.metadata.update({"doc_id": doc_id, "user_id": user_id})

    db.add_documents(chunks)
    return doc_id