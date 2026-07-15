import mongoose from 'mongoose'

const sourceSchema = new mongoose.Schema({
  page:    { type: mongoose.Schema.Types.Mixed },
  preview: { type: String },
}, { _id: false })

const messageSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  docId:   { type: String, required: true },
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: { type: [sourceSchema], default: [] },
}, { timestamps: true })

messageSchema.index({ userId: 1, docId: 1, createdAt: 1 })

export default mongoose.model('Message', messageSchema)