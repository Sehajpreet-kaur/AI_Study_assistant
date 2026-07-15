import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import authRoute from './routes/auth.js'
import ragRoute from './routes/rag.js'
import documentRoute from './routes/documents.js'

const app = express()
app.use(cors({
    origin : "https://ai-study-assistant-2-pqxq.onrender.com"}
))
app.use(express.json())

app.use('/api/auth',      authRoute)
app.use('/api/rag',       ragRoute)
app.use('/api/documents', documentRoute)

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    )
  })
  .catch(err => console.error(err))

