import { Router } from 'express'
import axios from 'axios'
import multer from 'multer'
import auth from "../middleware/auth.js"
import Document from '../models/Documents.js'
import Message from '../models/Message.js'

const upload  = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },          // 20 MB cap
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed'))
})
const RAG_URL = process.env.RAG_URL || 'http://localhost:8000'

const router = Router()

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' })

    const form = new FormData()
    form.append('file', new Blob([req.file.buffer], { type: 'application/pdf' }), req.file.originalname)

    const response = await axios.post(`${RAG_URL}/upload`, form, {
      headers: { 'x-user-id': req.user.id },
      timeout: 120000,                               // ingestion can be slow
      maxBodyLength: Infinity
    })

    const savedDoc = await Document.create({
      userId:   req.user.id,
      docId:    response.data.doc_id,
      filename: req.file.originalname
    })

    res.json(savedDoc)
  } catch (err) {
    console.error('UPLOAD ERROR:', err.message, err.response?.status, err.response?.data)
    const status = err.response?.status
    if (status === 422) {
      // e.g. scanned PDF with no text: pass the real reason to the user
      return res.status(422).json({ msg: err.response.data?.detail || 'Could not read this PDF' })
    }
    res.status(500).json({ msg: 'Upload failed. Please try again.' })
  }
})

router.post('/ask', auth, async (req, res) => {
  const { question, doc_id } = req.body
  if (!question?.trim() || !doc_id) {
    return res.status(400).json({ msg: 'question and doc_id are required' })
  }

  try {
    // Make sure this doc belongs to the user before doing anything
    const doc = await Document.findOne({ userId: req.user.id, docId: doc_id })
    if (!doc) return res.status(404).json({ msg: 'Document not found' })

    const response = await axios.post(`${RAG_URL}/ask`, {
      question, doc_id, user_id: req.user.id
    }, { timeout: 60000 })

    // Save both messages only after the RAG call succeeds
    await Message.insertMany([
      { userId: req.user.id, docId: doc_id, role: 'user', content: question },
      { userId: req.user.id, docId: doc_id, role: 'assistant',
        content: response.data.answer, sources: response.data.sources || [] }
    ])

    res.json(response.data)
  } catch (err) {
    console.error('ASK ERROR:', err.message, err.response?.status, err.response?.data)

    if (err.response?.status === 409) {
      // Vectors are gone: remove the ghost record so the UI stops listing it
      await Document.deleteOne({ userId: req.user.id, docId: doc_id })
      await Message.deleteMany({ userId: req.user.id, docId: doc_id })
      return res.status(409).json({ msg: 'This document needs to be re-uploaded.' })
    }
    res.status(500).json({ msg: 'Query failed. Please try again.' })
  }
})

router.get('/documents', auth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id }).sort('-createdAt')
    res.json(docs)
  } catch {
    res.status(500).json({ msg: 'Failed to fetch documents' })
  }
})

router.get('/messages/:docId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      userId: req.user.id,
      docId:  req.params.docId
    }).sort('createdAt')
    res.json(messages)
  } catch {
    res.status(500).json({ msg: 'Failed to fetch chat history' })
  }
})

export default router