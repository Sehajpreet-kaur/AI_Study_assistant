import { Router } from 'express'
import axios from 'axios'
import multer from 'multer'
import auth from "../middleware/auth.js"
import Document from '../models/Documents.js'
import Message from '../models/Message.js'

const upload  = multer({ storage: multer.memoryStorage() })
const RAG_URL = process.env.RAG_URL || 'http://localhost:8000'

const router= Router()
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const form = new FormData()
    form.append('file', new Blob([req.file.buffer]), req.file.originalname)

    const response = await axios.post(`${RAG_URL}/upload`, form, {
      headers: { 'x-user-id': req.user.id }
    })

    const savedDoc= await Document.create({
      userId:   req.user.id,
      docId:    response.data.doc_id,
      filename: req.file.originalname
    })

    res.json(savedDoc)
  } catch (err) {
    res.status(500).json({ msg: 'Upload failed', error: err.message })
  }
})

router.post('/ask', auth, async (req, res) => {
  try {
    const { question, doc_id } = req.body

    // Save the user's question first
    await Message.create({
      userId:  req.user.id,
      docId:   doc_id,
      role:    'user',
      content: question
    })

    const response = await axios.post(`${RAG_URL}/ask`, {
      ...req.body,
      user_id: req.user.id
    })

    // Save the assistant's answer, including sources
    await Message.create({
      userId:  req.user.id,
      docId:   doc_id,
      role:    'assistant',
      content: response.data.answer,
      sources: response.data.sources || []
    })

    res.json(response.data)
  } catch (err) {
    res.status(500).json({ msg: 'Query failed' })
  }
})

router.get('/documents', auth, async (req, res) => {
  const docs = await Document.find({ userId: req.user.id }).sort('-createdAt')
  res.json(docs)
})

router.get('/messages/:docId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      userId: req.user.id,
      docId:  req.params.docId
    }).sort('createdAt')
    res.json(messages)
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch chat history' })
  }
})

export default router