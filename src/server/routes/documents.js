import { Router } from 'express'
import auth from "../middleware/auth.js"
import Document from '../models/Documents.js'

const router= Router()
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
    await Document.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    res.json({ msg: 'Deleted' })
  } catch {
    res.status(500).json({ msg: 'Delete failed' })
  }
})

export default router