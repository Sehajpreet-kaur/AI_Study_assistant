import { Router } from 'express'
import axios from 'axios'
import auth from "../middleware/auth.js"
import Document from '../models/Documents.js'
import Message from '../models/Message.js'

const RAG_URL = process.env.RAG_URL || 'http://localhost:8000'
const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id }).sort('-createdAt')
    res.json(docs)
  } catch {
    res.status(500).json({ msg: 'Failed to fetch documents' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id })
    if (!doc) return res.status(404).json({ msg: 'Document not found' })

    // 1. Vectors first. If this fails, keep the Mongo record so the user can retry
    await axios.delete(`${RAG_URL}/documents/${doc.docId}`, {
      headers: { 'x-user-id': req.user.id },
      timeout: 60000
    })

    // 2. Then chat history and the document record
    await Message.deleteMany({ userId: req.user.id, docId: doc.docId })
    await doc.deleteOne()

    res.json({ msg: 'Deleted' })
  } catch (err) {
    console.error('DELETE ERROR:', err.message, err.response?.status)
    res.status(500).json({ msg: 'Delete failed. Please try again.' })
  }
})

export default router