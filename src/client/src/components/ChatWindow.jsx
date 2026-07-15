import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'
import SourcePanel from './SourcePanel'

export default function ChatWindow({ docId, filename }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [sources, setSources]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const bottomRef = useRef()

  useEffect(() => {
    loadHistory()
  }, [docId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const { data } = await api.get(`/rag/messages/${docId}`)
      if (data.length === 0) {
        setMessages([
          { role: 'assistant', content: `Hi! I've loaded "${filename}". Ask me anything about it.` }
        ])
      } else {
        setMessages(data)
        // restore sources from the most recent assistant message, if any
        const lastAssistant = [...data].reverse().find(m => m.role === 'assistant')
        setSources(lastAssistant?.sources || [])
      }
    } catch {
      setMessages([
        { role: 'assistant', content: `Hi! I've loaded "${filename}". Ask me anything about it.` }
      ])
    }
    setHistoryLoading(false)
  }

  const ask = async () => {
    const question = input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    setSources([])

    try {
      const { data } = await api.post('/rag/ask', { question, doc_id: docId })
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
      setSources(data.sources || [])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.'
      }])
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {historyLoading && <p style={styles.muted}>Loading conversation...</p>}

        {!historyLoading && messages.map((m, i) => (
          <div key={m._id || i} style={styles.row(m.role)}>
            <div style={styles.bubble(m.role)}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div style={styles.row('assistant')}>
            <div style={styles.bubble('assistant')}>
              <span style={styles.dots}>
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <SourcePanel sources={sources} />

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask()}
          placeholder="Ask a question about your document..."
          disabled={loading || historyLoading}
        />
        <button style={styles.btn} onClick={ask} disabled={loading || historyLoading || !input.trim()}>
          {loading ? '...' : 'Ask'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '860px', margin: '0 auto', width: '100%', padding: '0 1rem 1rem' },
  messages:  { flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, maxHeight: 'calc(100vh - 220px)' },
  row:       (role) => ({ display: 'flex', justifyContent: role === 'user' ? 'flex-end' : 'flex-start' }),
  bubble:    (role) => ({
    maxWidth: '75%', padding: '12px 16px', borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: role === 'user' ? '#6C63FF' : '#fff',
    color: role === 'user' ? '#fff' : '#333',
    fontSize: '15px', lineHeight: '1.6',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    border: role === 'assistant' ? '1px solid #eee' : 'none',
  }),
  dots:      { display: 'inline-flex', gap: '3px', fontSize: '20px', lineHeight: 1 },
  muted:     { color: '#999', fontSize: '14px', textAlign: 'center' },
  inputRow:  { display: 'flex', gap: '10px', padding: '12px 0 0' },
  input:     { flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' },
  btn:       { padding: '12px 22px', borderRadius: '10px', background: '#6C63FF', color: '#fff', border: 'none', fontSize: '15px', cursor: 'pointer', fontWeight: 500 },
}