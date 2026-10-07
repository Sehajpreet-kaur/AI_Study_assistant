import { Router } from 'express'
import axios from 'axios'
import multer from 'multer'
import auth from "../middleware/auth.js"
import Document from '../models/Documents.js'
import Message from '../models/Message.js'

const MAX_MB = 20
const RAG_URL = process.env.RAG_URL || 'http://localhost:8000'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const looksLikePdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    if (looksLikePdf) return cb(null, true)
    const e = new Error('Unsupported file format. Please upload a PDF.')
    e.code = 'UNSUPPORTED_TYPE'
    cb(e)
  }
})

// Wraps multer so its errors become clean JSON responses (shown by the toast)
const uploadPdf = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ msg: `File is too large. Maximum size is ${MAX_MB} MB.` })
    }
    if (err.code === 'UNSUPPORTED_TYPE') {
      return res.status(400).json({ msg: err.message })
    }
    console.error('MULTER ERROR:', err.message)
    res.status(400).json({ msg: 'Could not read the uploaded file.' })
  })
}

// FastAPI's `detail` is not always a string, so only pass it through if it is
const detailOf = (err, fallback) => {
  const d = err.response?.data?.detail
  return typeof d === 'string' ? d : fallback
}

// No response at all means a timeout or a sleeping service
const isUnreachable = (err) => !err.response || err.code === 'ECONNABORTED'

const router = Router()

router.post('/upload', auth, uploadPdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' })

    // A renamed .docx/.png has the right extension but not the PDF signature
    if (req.file.buffer.subarray(0, 5).toString() !== '%PDF-') {
      return res.status(400).json({ msg: 'This file is not a valid PDF.' })
    }

    const form = new FormData()
    form.append('file', new Blob([req.file.buffer], { type: 'application/pdf' }), req.file.originalname)

    const response = await axios.post(`${RAG_URL}/upload`, form, {
      headers: { 'x-user-id': req.user.id },
      timeout: 120000,
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
      return res.status(422).json({ msg: detailOf(err, 'Could not read this PDF.') })
    }
    if (status === 429) {
      return res.status(429).json({ msg: 'The AI service is busy. Please wait a minute and try again.' })
    }
    if (isUnreachable(err)) {
      return res.status(504).json({ msg: 'The server is waking up. Please try again in a minute.' })
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
    const doc = await Document.findOne({ userId: req.user.id, docId: doc_id })
    if (!doc) return res.status(404).json({ msg: 'Document not found' })

    const response = await axios.post(`${RAG_URL}/ask`, {
      question, doc_id, user_id: req.user.id
    }, { timeout: 60000 })

    await Message.insertMany([
      { userId: req.user.id, docId: doc_id, role: 'user', content: question },
      { userId: req.user.id, docId: doc_id, role: 'assistant',
        content: response.data.answer, sources: response.data.sources || [] }
    ])

    res.json(response.data)
  } catch (err) {
    console.error('ASK ERROR:', err.message, err.response?.status, err.response?.data)
    const status = err.response?.status

    if (status === 409) {
      await Document.deleteOne({ userId: req.user.id, docId: doc_id })
      await Message.deleteMany({ userId: req.user.id, docId: doc_id })
      return res.status(409).json({ msg: 'This document needs to be re-uploaded.' })
    }
    if (status === 429) {
      return res.status(429).json({ msg: 'The AI service is busy. Please wait a minute and try again.' })
    }
    if (status === 503) {
      return res.status(503).json({ msg: detailOf(err, 'The AI model is unavailable right now.') })
    }
    if (isUnreachable(err)) {
      return res.status(504).json({ msg: 'The server is waking up. Please try again in a minute.' })
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