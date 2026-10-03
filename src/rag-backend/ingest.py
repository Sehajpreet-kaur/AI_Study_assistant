from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
import uuid
from embeddings import EMBED

DB_PATH = "./chroma_db"


def ingest_pdf(path: str, user_id: str) -> str:
    print("=== INGEST START ===")
    print("PDF path:", path)

    doc_id = str(uuid.uuid4())

    # Load PDF
    pages = PyPDFLoader(path).load()

    print("Pages loaded:", len(pages))

    # Remove pages that contain no actual text
    pages = [
        page for page in pages
        if page.page_content and page.page_content.strip()
    ]

    print("Pages with text:", len(pages))

    if not pages:
        raise ValueError(
            "PDF contains no extractable text. "
            "It may be a scanned/image-only PDF."
        )

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100
    )

    chunks = splitter.split_documents(pages)

    print("Chunks created:", len(chunks))

    if not chunks:
        raise ValueError("No text chunks were created from the PDF.")

    # Add metadata
    for chunk in chunks:
        chunk.metadata.update({
            "doc_id": doc_id,
            "user_id": user_id
        })

    # Test embedding directly
    test_vectors = EMBED.embed_documents(
        [chunks[0].page_content]
    )

    print("Test embedding count:", len(test_vectors))
    print(
        "Test embedding dimension:",
        len(test_vectors[0]) if test_vectors else 0
    )

    if not test_vectors:
        raise ValueError("Embedding model returned an empty vector.")

    # Store in Chroma
    db = Chroma(
        persist_directory=DB_PATH,
        embedding_function=EMBED,
        collection_name="study_docs"
    )

    db.add_documents(chunks)

    print("Documents added to Chroma")
    print("=== INGEST COMPLETE ===")

    return doc_id