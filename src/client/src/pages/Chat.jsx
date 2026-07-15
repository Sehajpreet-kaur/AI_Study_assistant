import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ChatWindow from '../components/ChatWindow'

export default function Chat() {
  const { state } = useLocation()
  const navigate  = useNavigate()

  useEffect(() => {
    if (!state?.docId) {
      navigate('/dashboard')
    }
  }, [state, navigate])

  if (!state?.docId) {
    return null
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.back} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <span style={styles.filename}>{state.filename}</span>
      </div>
      <ChatWindow docId={state.docId} filename={state.filename} />
    </div>
  )
}
const styles = {
  page:     { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f8f8' },
  topBar:   { background: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #eee' },
  back:     { background: 'none', border: 'none', cursor: 'pointer', color: '#6C63FF', fontSize: '14px', fontWeight: 500 },
  filename: { fontSize: '14px', color: '#444', fontWeight: 500 },
}