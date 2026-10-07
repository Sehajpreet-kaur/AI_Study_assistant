from fastapi import FastAPI, UploadFile, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ingest import ingest_pdf
from retriever import answer_question
import shutil, os
from starlette.concurrency import run_in_threadpool
from vectorstore import client, COLLECTION, doc_filter
from fastapi import Header
from qdrant_client import models

app = FastAPI()
app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/upload")
async def upload(
    file: UploadFile = File(...),
    x_user_id: str = Header(...)
):
    os.makedirs("uploads", exist_ok=True)
    path = f"uploads/{x_user_id}_{file.filename}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    doc_id = ingest_pdf(path, x_user_id)
    return {"doc_id": doc_id, "filename": file.filename}

@app.post("/ask")
async def ask(body: dict):
    flt = doc_filter(body["doc_id"], body["user_id"])
    count = client.count(COLLECTION, count_filter=flt, exact=True).count
    if count == 0:
        raise HTTPException(status_code=409, detail="Document index missing. Please re-upload.")
    return await run_in_threadpool(answer_question, body["question"], body["doc_id"], body["user_id"])


@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, x_user_id: str = Header(...)):
    client.delete(
        COLLECTION,
        points_selector=models.FilterSelector(filter=doc_filter(doc_id, x_user_id)),
    )
    return {"ok": True}