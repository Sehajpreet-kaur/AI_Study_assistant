RAG Study Assistant

A full-stack study assistant that lets you upload PDFs (lecture notes, textbook chapters, etc.) and ask questions about them. Answers are generated using Retrieval-Augmented Generation (RAG), grounded strictly in the content of your uploaded document, with source citations for every response.

Features:

* User authentication (register/login with JWT)
* PDF upload and ingestion
* Chat with your document — ask questions, get answers grounded in the source material
* Source citations for every answer (page number + preview snippet)
* Persistent chat history — resume a conversation right where you left off when you reopen a document
* Delete uploaded documents
* Fast, low-latency responses via Groq's LLM inference


Tech Stack:

* Frontend -React (Vite)
            React Router
            Axios

* Backend (API server) -Node.js + Express
                        MongoDB with Mongoose
                        JWT-based authentication
  
* RAG Service - FastAPI (Python)
                LangChain
                ChromaDB (vector store)
                HuggingFace sentence-transformers (all-MiniLM-L6-v2) for embeddings
                Groq (llama-3.1-8b-instant) for answer generation

Architecture:

The Express server handles auth, stores document/chat metadata in MongoDB, and proxies upload/ask requests to the FastAPI RAG service, which handles chunking, embedding, similarity search, and LLM-based answer generation.

  ┌─────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   React     │ ───▶ │  Express API      │ ───▶ │   FastAPI RAG        │
│  Frontend   │ ◀─── │  (auth, Mongo,    │ ◀─── │   Service            │
│             │      │   proxy to RAG)   │      │   (embed, retrieve,   │
└─────────────┘      └──────────────────┘      │    generate answer)  │
                             │                   └─────────────────────┘
                             ▼                            │
                      ┌─────────────┐                     ▼
                      │  MongoDB    │              ┌─────────────┐
                      │ (users,     │              │  ChromaDB    │
                      │  documents, │              │ (vector store│
                      │  messages)  │              │  on disk)    │
                      └─────────────┘              └─────────────┘
