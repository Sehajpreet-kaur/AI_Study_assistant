import { useState, useRef } from 'react'
import api from '../api/axios'

export default function UploadBox({ onUploaded }) {
  const [loading, setLoading]   = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError]       = useState('')
  const inputRef = useRef()

  const processFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/rag/upload', form)
      onUploaded(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Upload failed. Try again.')
    }
    setLoading(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  return (
    <div
      style={{ ...styles.box, ...(dragOver ? styles.boxOver : {}) }}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => !loading && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={e => processFile(e.target.files[0])}
      />

      {loading ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={styles.uploadText}>Processing your document...</p>
          <p style={styles.subText}>This may take a minute for large files</p>
        </div>
      ) : (
        <div style={styles.center}>
          <div style={styles.uploadIcon}>📂</div>
          <p style={styles.uploadText}>Drop your PDF here or click to browse</p>
          <p style={styles.subText}>Lecture notes, textbooks, any PDF works</p>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}
    </div>
  )
}

const styles = {
  box:        { border: '2px dashed #ccc', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' },
  boxOver:    { borderColor: '#6C63FF', background: '#f3f2ff' },
  center:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  uploadIcon: { fontSize: '36px' },
  uploadText: { margin: 0, fontWeight: 500, fontSize: '15px', color: '#333' },
  subText:    { margin: 0, fontSize: '13px', color: '#999' },
  error:      { color: '#e53e3e', fontSize: '13px', marginTop: '12px' },
  spinner:    { width: '28px', height: '28px', border: '3px solid #eee', borderTop: '3px solid #6C63FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}